const Session = require('./models/Session');

// rooms: code -> { hostSocketId, timer }
const rooms = new Map();

module.exports = (io) => {
  io.on('connection', (socket) => {

    // ─── HOST JOIN ──────────────────────────────────────────────
    socket.on('hostJoin', async ({ code, userId }) => {
      try {
        const session = await Session.findOne({ code, host: userId, status: { $ne: 'ended' } })
          .populate('quiz');
        if (!session) return socket.emit('error', 'Sesi tidak ditemukan atau sudah berakhir');

        socket.join(code);
        socket.data = { role: 'host', code, sessionId: session._id.toString() };

        const room = rooms.get(code) || {};
        rooms.set(code, { ...room, hostSocketId: socket.id });

        socket.emit('hostJoined', {
          _id: session._id,
          code: session.code,
          status: session.status,
          currentQuestion: session.currentQuestion,
          participants: session.participants.filter(p => p.isActive),
          quiz: {
            _id: session.quiz._id,
            title: session.quiz.title,
            totalQuestions: session.quiz.questions.length,
            coverColor: session.quiz.coverColor,
            bgmUrl: session.quiz.bgmUrl,
            bgmLabel: session.quiz.bgmLabel
          }
        });
      } catch {
        socket.emit('error', 'Gagal bergabung sebagai host');
      }
    });

    // ─── STUDENT JOIN ────────────────────────────────────────────
    socket.on('studentJoin', async ({ code, name }) => {
      try {
        code = code.toUpperCase().trim();
        const session = await Session.findOne({ code, status: 'waiting' })
          .populate('quiz', 'title coverColor bgmUrl bgmLabel _id');
        if (!session) return socket.emit('joinError', 'Kode tidak valid atau sesi sudah dimulai');
        if (!name?.trim()) return socket.emit('joinError', 'Nama tidak boleh kosong');

        socket.join(code);
        socket.data = { role: 'student', code, name: name.trim() };

        const trimmedName = name.trim();
        session.participants.push({ socketId: socket.id, name: trimmedName, score: 0 });
        await session.save();

        socket.emit('studentJoined', {
          name: trimmedName,
          quiz: {
            _id: session.quiz._id,
            title: session.quiz.title,
            coverColor: session.quiz.coverColor,
            bgmUrl: session.quiz.bgmUrl,
            bgmLabel: session.quiz.bgmLabel
          }
        });

        const activeParticipants = session.participants.filter(p => p.isActive);
        io.to(code).emit('participantUpdate', { participants: activeParticipants });
      } catch {
        socket.emit('joinError', 'Terjadi kesalahan saat bergabung');
      }
    });

    // ─── START QUIZ ──────────────────────────────────────────────
    socket.on('startQuiz', async ({ code }) => {
      try {
        const session = await Session.findOne({ code, status: 'waiting' }).populate('quiz');
        if (!session) return socket.emit('error', 'Sesi tidak dapat dimulai');

        session.status = 'active';
        session.currentQuestion = 0;
        session.questionStartTime = new Date();
        await session.save();

        const q = session.quiz.questions[0];
        io.to(code).emit('quizStarted', {
          ...buildQuestionPayload(q, 0, session.quiz.questions.length),
          quiz: { _id: session.quiz._id, title: session.quiz.title, bgmUrl: session.quiz.bgmUrl, bgmLabel: session.quiz.bgmLabel }
        });

        scheduleTimer(io, rooms, code, session._id, 0, q.timeLimit);
      } catch {
        socket.emit('error', 'Gagal memulai kuis');
      }
    });

    // ─── SUBMIT ANSWER ───────────────────────────────────────────
    socket.on('submitAnswer', async ({ code, optionIndex, matchAnswers }) => {
      try {
        const session = await Session.findOne({ code, status: 'active' }).populate('quiz');
        if (!session) return;

        const qIdx = session.currentQuestion;
        const question = session.quiz.questions[qIdx];
        if (!question) return;

        const participant = session.participants.find(p => p.socketId === socket.id);
        if (!participant) return;
        if (participant.answers.find(a => a.questionIndex === qIdx)) return;

        const timeMs = Date.now() - new Date(session.questionStartTime).getTime();
        const timeFactor = Math.max(0, 1 - timeMs / (question.timeLimit * 1000));

        let isCorrect = false;
        if (question.type === 'cocokkan') {
          // matchAnswers: array of { left, right } — all pairs must be correct
          if (Array.isArray(matchAnswers) && matchAnswers.length === question.matchPairs.length) {
            isCorrect = matchAnswers.every(ans => {
              const pair = question.matchPairs.find(p => p.left === ans.left);
              return pair && pair.right === ans.right;
            });
          }
        } else if (question.type === 'benar_salah') {
          isCorrect = !!question.options[optionIndex]?.isCorrect;
        } else {
          isCorrect = !!question.options[optionIndex]?.isCorrect;
        }

        let basePoints = isCorrect ? Math.round(question.points * (0.5 + 0.5 * timeFactor)) : 0;

        // Streak bonus
        if (isCorrect) {
          participant.currentStreak = (participant.currentStreak || 0) + 1;
        } else {
          participant.currentStreak = 0;
        }

        const sb = session.quiz.streakBonus;
        let bonusPoints = 0;
        let streakTriggered = false;
        if (isCorrect && sb?.enabled && participant.currentStreak >= sb.streakCount) {
          bonusPoints = Math.round(basePoints * (sb.multiplier - 1));
          streakTriggered = true;
        }

        const points = basePoints + bonusPoints;
        participant.answers.push({ questionIndex: qIdx, optionIndex: optionIndex ?? -1, correct: isCorrect, timeMs, points });
        participant.score += points;
        await session.save();

        socket.emit('answerResult', {
          correct: isCorrect,
          points,
          bonusPoints,
          streakTriggered,
          streak: participant.currentStreak,
          totalScore: participant.score
        });

        const answered = session.participants.filter(p => p.answers.find(a => a.questionIndex === qIdx)).length;
        const total = session.participants.filter(p => p.isActive).length;

        const room = rooms.get(code);
        if (room?.hostSocketId) {
          io.to(room.hostSocketId).emit('answerCount', { answered, total });
        }

        if (answered >= total) {
          clearRoomTimer(rooms, code);
          await revealAnswers(io, rooms, code, session, qIdx);
        }
      } catch {
        socket.emit('error', 'Gagal mengirim jawaban');
      }
    });

    // ─── NEXT QUESTION ───────────────────────────────────────────
    socket.on('nextQuestion', async ({ code }) => {
      try {
        clearRoomTimer(rooms, code);
        const session = await Session.findOne({ code, status: 'active' }).populate('quiz');
        if (!session) return;

        const nextIdx = session.currentQuestion + 1;
        if (nextIdx >= session.quiz.questions.length) {
          return endQuiz(io, code, session);
        }

        session.currentQuestion = nextIdx;
        session.questionStartTime = new Date();
        await session.save();

        const q = session.quiz.questions[nextIdx];
        io.to(code).emit('nextQuestion', buildQuestionPayload(q, nextIdx, session.quiz.questions.length));
        scheduleTimer(io, rooms, code, session._id, nextIdx, q.timeLimit);
      } catch {
        socket.emit('error', 'Gagal ke pertanyaan berikutnya');
      }
    });

    // ─── END QUIZ ────────────────────────────────────────────────
    socket.on('endQuiz', async ({ code }) => {
      try {
        clearRoomTimer(rooms, code);
        const session = await Session.findOne({ code });
        if (session) await endQuiz(io, code, session);
      } catch {}
    });

    // ─── DISCONNECT ──────────────────────────────────────────────
    socket.on('disconnect', async () => {
      const { code, role } = socket.data || {};
      if (!code || role !== 'student') return;
      try {
        const session = await Session.findOne({ code });
        if (!session) return;
        const p = session.participants.find(p => p.socketId === socket.id);
        if (p) {
          p.isActive = false;
          await session.save();
          io.to(code).emit('participantUpdate', { participants: session.participants.filter(p => p.isActive) });
        }
      } catch {}
    });
  });
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function buildQuestionPayload(question, index, total) {
  return {
    currentQuestion: index,
    total,
    question: {
      type:       question.type || 'pilihan_ganda',
      text:       question.text,
      imageUrl:   question.imageUrl || '',
      videoUrl:   question.videoUrl || '',
      options:    question.options.map(o => ({ text: o.text, imageUrl: o.imageUrl || '' })),
      matchPairs: (question.matchPairs || []).map(p => ({ left: p.left })), // hide right side
      timeLimit:  question.timeLimit,
      points:     question.points
    }
  };
}

function buildLeaderboard(session) {
  return session.participants
    .filter(p => p.isActive || p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((p, i) => ({ rank: i + 1, name: p.name, score: p.score }));
}

function clearRoomTimer(rooms, code) {
  const room = rooms.get(code);
  if (room?.timer) { clearTimeout(room.timer); room.timer = null; rooms.set(code, room); }
}

function scheduleTimer(io, rooms, code, sessionId, qIdx, timeLimit) {
  const room = rooms.get(code) || {};
  room.timer = setTimeout(async () => {
    try {
      const session = await Session.findById(sessionId).populate('quiz');
      if (!session || session.status !== 'active' || session.currentQuestion !== qIdx) return;
      await revealAnswers(io, rooms, code, session, qIdx);
    } catch {}
  }, timeLimit * 1000);
  rooms.set(code, room);
}

async function revealAnswers(io, rooms, code, session, qIdx) {
  const question = session.quiz.questions[qIdx];
  const correctIndex = question.options.findIndex(o => o.isCorrect);
  const leaderboard = buildLeaderboard(session);
  io.to(code).emit('timeUp', {
    correctIndex,
    correctPairs: question.matchPairs || [],
    leaderboard
  });
}

async function endQuiz(io, code, session) {
  const updated = await Session.findByIdAndUpdate(
    session._id,
    { status: 'ended' },
    { new: true }
  );
  const leaderboard = buildLeaderboard(updated || session);
  io.to(code).emit('quizEnded', { leaderboard, quizId: session.quiz?._id || session.quiz });
  rooms.delete(code);
}
