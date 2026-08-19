import api from './axios';

export const startGame = () => api.post('/game/start');
export const getStatus = () => api.get('/game/status');
export const getRounds = () => api.get('/game/rounds');
export const getQuestions = (roundId) => api.get(`/game/rounds/${roundId}/questions`);
export const submitRound = (roundId, data) => api.post(`/game/rounds/${roundId}/submit`, data);
export const getLeaderboard = () => api.get('/game/leaderboard');
