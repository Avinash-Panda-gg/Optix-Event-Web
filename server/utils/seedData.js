require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Round = require('../models/Round');
const Question = require('../models/Question');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/analyticsquest';

const rounds = [
  { roundNumber: 1, title: 'Data Detective', description: 'Analyze datasets and identify patterns', type: 'MCQ', timeLimit: 8, xpReward: 1000, difficulty: 'Warm-up' },
  { roundNumber: 2, title: 'Chart Challenge', description: 'Interpret visual data representations', type: 'Visual', timeLimit: 12, xpReward: 1500, difficulty: 'Moderate' },
  { roundNumber: 3, title: 'Speed Round', description: 'Race against the clock with rapid-fire questions', type: 'Timed', timeLimit: 10, xpReward: 2000, difficulty: 'Intense' },
  { roundNumber: 4, title: 'Strategy Lab', description: 'Solve complex business case studies', type: 'Case', timeLimit: 20, xpReward: 2500, difficulty: 'Hard' },
  { roundNumber: 5, title: 'Final Boss', description: 'The ultimate analytics challenge — elite level', type: 'Elite', timeLimit: 25, xpReward: 3000, difficulty: 'Elite' },
];

const questionSets = {
  1: [
    { questionText: 'A dataset has mean = 50, median = 45, and mode = 40. What type of skewness does this distribution exhibit?', options: ['A. Symmetric', 'B. Positively skewed (right-skewed)', 'C. Negatively skewed (left-skewed)', 'D. Cannot be determined'], correctAnswer: 'B', points: 100, orderIndex: 0, explanation: 'When mean > median > mode, the distribution is positively (right) skewed.' },
    { questionText: 'In a dataset of 10 values, the variance is 25. What is the standard deviation?', options: ['A. 625', 'B. 2.5', 'C. 5', 'D. 12.5'], correctAnswer: 'C', points: 100, orderIndex: 1, explanation: 'Standard deviation = sqrt(variance) = sqrt(25) = 5.' },
    { questionText: 'Which of the following is NOT a measure of central tendency?', options: ['A. Mean', 'B. Median', 'C. Mode', 'D. Range'], correctAnswer: 'D', points: 150, orderIndex: 2, explanation: 'Range is a measure of spread/dispersion, not central tendency.' },
    { questionText: "A company's sales data for 5 months: 100, 120, 105, 115, 110. What is the 3-month moving average for months 3–5?", options: ['A. 108', 'B. 110', 'C. 112', 'D. 115'], correctAnswer: 'B', points: 150, orderIndex: 3, explanation: '(105 + 115 + 110) / 3 = 110.' },
  ],
  2: [
    { questionText: "A pie chart shows Market Share: A=40%, B=30%, C=20%, D=10%. If total revenue is ₹10 Cr, what is Company B's revenue?", options: ['A. ₹2 Cr', 'B. ₹3 Cr', 'C. ₹4 Cr', 'D. ₹1 Cr'], correctAnswer: 'B', points: 150, orderIndex: 0, explanation: '30% of ₹10 Cr = ₹3 Cr.' },
    { questionText: 'A bar chart shows monthly sales: Jan=200, Feb=250, Mar=180. Which month had the highest Month-on-Month growth rate?', options: ['A. January', 'B. February', 'C. March', 'D. All equal'], correctAnswer: 'B', points: 150, orderIndex: 1, explanation: 'Feb growth = (250-200)/200 = 25%. Mar = -28%. Feb is highest positive growth.' },
    { questionText: 'On a scatter plot, the correlation coefficient r = -0.92. This indicates:', options: ['A. Strong positive correlation', 'B. Weak negative correlation', 'C. Strong negative correlation', 'D. No correlation'], correctAnswer: 'C', points: 200, orderIndex: 2, explanation: 'r close to -1 indicates strong negative correlation between the variables.' },
    { questionText: 'A histogram shows a dataset is bimodal. This means:', options: ['A. The data has two distinct peaks/modes', 'B. The data is perfectly symmetric', 'C. The mean equals the median', 'D. The data has no outliers'], correctAnswer: 'A', points: 200, orderIndex: 3, explanation: 'Bimodal means the distribution has two distinct peaks, indicating two modes.' },
  ],
  3: [
    { questionText: 'What does ISR stand for in market research context?', options: ['A. Integrated Survey Research', 'B. In-Store Research', 'C. Indexed Statistical Review', 'D. Internal Sales Report'], correctAnswer: 'B', points: 200, orderIndex: 0, explanation: 'ISR = In-Store Research, which analyzes consumer behavior inside retail environments.' },
    { questionText: 'The p-value in hypothesis testing represents:', options: ['A. The probability the null hypothesis is true', 'B. The probability of observing results as extreme as the test statistic, assuming H₀ is true', 'C. The confidence interval width', 'D. The effect size of the treatment'], correctAnswer: 'B', points: 200, orderIndex: 1, explanation: 'p-value = P(data as extreme or more extreme | H₀ is true). Does NOT equal P(H₀ is true).' },
    { questionText: 'Which sampling method ensures every member of the population has an equal chance of selection?', options: ['A. Convenience sampling', 'B. Stratified sampling', 'C. Simple random sampling', 'D. Cluster sampling'], correctAnswer: 'C', points: 250, orderIndex: 2, explanation: 'Simple random sampling gives every individual an equal probability of being selected.' },
    { questionText: 'Net Promoter Score (NPS) ranges from:', options: ['A. 0 to 100', 'B. -100 to 100', 'C. 1 to 10', 'D. 0 to 10'], correctAnswer: 'B', points: 250, orderIndex: 3, explanation: 'NPS ranges from -100 (all detractors) to +100 (all promoters).' },
  ],
  4: [
    { questionText: 'A retail study shows: eye-level placement increases sales by 30%, end-cap by 45%. If a product earns ₹1,000/month normally, what is the projected revenue at end-cap placement?', options: ['A. ₹1,300', 'B. ₹1,450', 'C. ₹1,500', 'D. ₹1,350'], correctAnswer: 'B', points: 300, orderIndex: 0, explanation: '₹1,000 × 1.45 = ₹1,450.' },
    { questionText: "Brand A has 60% market share. The market grows by 20% from 1,000 units. If Brand A's share holds, what is Brand A's new volume?", options: ['A. 600 units', 'B. 720 units', 'C. 750 units', 'D. 660 units'], correctAnswer: 'B', points: 300, orderIndex: 1, explanation: 'New market = 1,200 units. Brand A = 60% × 1,200 = 720 units.' },
    { questionText: 'A focus group of 8 people shows 6 prefer Product X. This finding is MOST appropriately described as:', options: ['A. Statistically significant evidence to launch nationally', 'B. Directional qualitative insight requiring larger quantitative validation', 'C. Conclusive proof of consumer preference', 'D. Insufficient to draw any conclusions'], correctAnswer: 'B', points: 400, orderIndex: 2, explanation: 'Focus groups (n=8) are qualitative tools. Results are directional — not statistically significant.' },
    { questionText: 'CSAT scores: Pre-intervention mean=6.2, Post=7.8, SD=1.5, n=100. The improvement is:', options: ['A. Not significant — SD is too high', 'B. Statistically significant given large sample and meaningful effect size', 'C. Practically significant but statistically insignificant', 'D. Neither practically nor statistically significant'], correctAnswer: 'B', points: 400, orderIndex: 3, explanation: 'Effect size = (7.8-6.2)/1.5 = 1.07 (large Cohen d). With n=100, this is highly significant.' },
  ],
  5: [
    { questionText: 'A company launches in 3 cities. City A: 10,000 respondents, 68% awareness. City B: 5,000, 72%. City C: 8,000, 65%. What is the weighted average awareness?', options: ['A. 68.3%', 'B. 67.9%', 'C. 69.1%', 'D. 66.5%'], correctAnswer: 'B', points: 500, orderIndex: 0, explanation: '(10000×0.68 + 5000×0.72 + 8000×0.65) / 23000 = 15600/23000 ≈ 67.8% ≈ 67.9%' },
    { questionText: 'In regression analysis, R² = 0.85 means:', options: ['A. 85% of variation in Y is explained by the model', 'B. The correlation coefficient is 0.85', 'C. 85% of predictions are correct', 'D. The model has 85% accuracy on test data'], correctAnswer: 'A', points: 500, orderIndex: 1, explanation: 'R² = coefficient of determination = proportion of variance in Y explained by the model.' },
    { questionText: 'Brand tracker: Awareness 80% → Consideration 45% → Trial 30% → Loyalty 20%. The biggest funnel drop occurs between:', options: ['A. Awareness → Consideration', 'B. Consideration → Trial', 'C. Trial → Loyalty', 'D. Equal across all stages'], correctAnswer: 'A', points: 600, orderIndex: 2, explanation: 'Drop A→C = 35pp (43.75%). C→T = 15pp (33.3%). T→L = 10pp (33.3%). Biggest absolute drop is A→C.' },
    { questionText: "OPTIX ISR study: 40% of shoppers spend <2 min (P_buy=15%), 35% spend 2-5 min (P_buy=40%), 25% spend >5 min (P_buy=70%). Expected overall purchase probability:", options: ['A. 41.5%', 'B. 35.5%', 'C. 38.0%', 'D. 33.5%'], correctAnswer: 'C', points: 600, orderIndex: 3, explanation: '(0.40×0.15) + (0.35×0.40) + (0.25×0.70) = 0.06 + 0.14 + 0.175 = 0.375 ≈ 38.0%' },
  ],
};

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await Round.deleteMany({});
    await Question.deleteMany({});
    console.log('🗑️  Cleared existing rounds and questions');

    const createdRounds = [];
    for (const roundData of rounds) {
      const round = await Round.create(roundData);
      createdRounds.push(round);
      console.log(`  ✓ Round ${round.roundNumber}: ${round.title}`);
    }

    let totalQuestions = 0;
    for (const round of createdRounds) {
      const questionsForRound = questionSets[round.roundNumber];
      for (const qData of questionsForRound) {
        await Question.create({ ...qData, roundId: round._id, roundNumber: round.roundNumber });
        totalQuestions++;
      }
      console.log(`  ✓ ${questionsForRound.length} questions → Round ${round.roundNumber}`);
    }

    // Admin user
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'OPTIX Admin',
        rollNumber: 'ADMIN001',
        password: 'optix@admin2026',
        role: 'admin',
        status: 'NOT_STARTED',
      });
      console.log('\n👤 Admin created → Roll: ADMIN001 | Password: optix@admin2026');
    } else {
      console.log('\n👤 Admin already exists — skipped.');
    }

    console.log(`\n🎉 Seeding complete! ${createdRounds.length} rounds · ${totalQuestions} questions`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
