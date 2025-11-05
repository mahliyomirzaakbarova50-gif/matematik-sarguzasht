import React, { useState, useEffect, useCallback, FormEvent, useMemo } from 'react';
import { Operation, Difficulty, Problem } from './types';

const StarIcon = ({ className }: { className: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.006z" clipRule="evenodd" />
  </svg>
);

// FIX: Moved `ControlButton` outside of the `App` component to prevent it from being redeclared on every render. This fixes the generic type inference issues and improves performance.
// FIX: Corrected the 'setter' prop type to `React.Dispatch<React.SetStateAction<T>>`. The previous, more generic type was causing TypeScript to fail at inferring the component's generic type, leading to errors.
function ControlButton<T>({ value, label, current, setter }: { value: T, label: React.ReactNode, current: T, setter: React.Dispatch<React.SetStateAction<T>> }) {
  return (
    <button
      onClick={() => setter(value)}
      className={`px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base rounded-full font-bold transition-all duration-300 ${current === value ? 'bg-blue-500 text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'}`}
    >
      {label}
    </button>
  );
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [secretWordInput, setSecretWordInput] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [isAuthShaking, setIsAuthShaking] = useState<boolean>(false);
  const SECRET_WORD = 'MATHWIZ';

  const [operation, setOperation] = useState<Operation>(Operation.Add);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Easy);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'incorrect'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const totalQuestions = 10;

  const correctAnswerSound = useMemo(() => new Audio('https://pixabay.com/sound-effects/success-1-6297.mp3'), []);
  const incorrectAnswerSound = useMemo(() => new Audio('https://pixabay.com/sound-effects/negative_beeps-6008.mp3'), []);

  const handleAuthSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (secretWordInput.toUpperCase() === SECRET_WORD) {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Mahfiy soʻz notoʻgʻri. Qaytadan urinib koʻring.');
      setIsAuthShaking(true);
      setTimeout(() => setIsAuthShaking(false), 500);
    }
  };
  
  const generateProblem = useCallback(() => {
    let num1: number, num2: number, answer: number;

    const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    let min = 1, max = 10;
    if (difficulty === Difficulty.Medium) { min = 10; max = 50; }
    if (difficulty === Difficulty.Hard) { min = 25; max = 100; }

    switch (operation) {
      case Operation.Add:
        num1 = getRandomInt(min, max);
        num2 = getRandomInt(min, max);
        answer = num1 + num2;
        break;
      case Operation.Subtract:
        const n1 = getRandomInt(min, max);
        const n2 = getRandomInt(min, max);
        num1 = Math.max(n1, n2);
        num2 = Math.min(n1, n2);
        answer = num1 - num2;
        break;
      case Operation.Multiply:
        if (difficulty === Difficulty.Easy) { min = 2; max = 6; }
        if (difficulty === Difficulty.Medium) { min = 3; max = 9; }
        if (difficulty === Difficulty.Hard) { min = 6; max = 12; }
        num1 = getRandomInt(min, max);
        num2 = getRandomInt(min, max);
        answer = num1 * num2;
        break;
      case Operation.Divide:
        if (difficulty === Difficulty.Easy) { min = 2; max = 6; }
        if (difficulty === Difficulty.Medium) { min = 3; max = 9; }
        if (difficulty === Difficulty.Hard) { min = 6; max = 12; }
        const res = getRandomInt(min, max);
        num2 = getRandomInt(min, max);
        num1 = res * num2;
        answer = res;
        break;
    }
    setProblem({ num1, num2, operation, answer });
    setUserAnswer('');
    setFeedback('idle');
    setIsChecking(false);
  }, [operation, difficulty]);

  useEffect(() => {
    if (isAuthenticated && gameState === 'playing') {
      generateProblem();
    }
  }, [generateProblem, gameState, isAuthenticated]);

  const handleRestart = () => {
    setScore(0);
    setStreak(0);
    setQuestionNumber(1);
    setGameState('playing');
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (userAnswer === '' || isChecking) return;

    setIsChecking(true);
    const answerNum = parseInt(userAnswer, 10);

    if (answerNum === problem?.answer) {
      correctAnswerSound.play();
      setFeedback('correct');
      setFeedbackMessage('Toʻgʻri! 🎉');
      setScore(s => s + 1);
      setStreak(s => s + 1);
    } else {
      incorrectAnswerSound.play();
      setFeedback('incorrect');
      setFeedbackMessage(`Xato! Toʻgʻri javob: ${problem?.answer} 🤔`);
      setStreak(0);
    }

    setTimeout(() => {
      if (questionNumber >= totalQuestions) {
        setGameState('finished');
      } else {
        setQuestionNumber(q => q + 1);
        generateProblem();
      }
    }, 1500);
  };

  const feedbackColor = feedback === 'correct' ? 'text-green-500' : 'text-red-500';
  const feedbackAnimation = feedback === 'correct' ? 'animate-pop-in' : feedback === 'incorrect' ? 'animate-shake' : '';
  
  const renderGame = () => {
    if (gameState === 'finished') {
      return (
        <div className="w-full max-w-md md:max-w-lg mx-auto bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 text-center animate-pop-in">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-700 dark:text-slate-100">Oʻyin Tugadi!</h1>
          <p className="text-xl text-slate-600 dark:text-slate-300">Sizning yakuniy hisobingiz:</p>
          <div className="text-6xl font-bold text-blue-500 my-4">{score}</div>
          <p className="text-lg text-slate-500 dark:text-slate-400">
            Siz {totalQuestions} ta savoldan {score} tasiga toʻgʻri javob berdingiz.
          </p>
          <button
            onClick={handleRestart}
            className="w-full md:w-3/4 bg-green-500 hover:bg-green-600 text-white font-bold text-xl py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 mt-4"
          >
            Qayta Boshlash
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="w-full max-w-md md:max-w-lg mx-auto bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
          <header className="text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-700 dark:text-slate-100">Matematika Sarguzashti</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Bilimlaringizni sinab ko'ring!</p>
          </header>

          <div className="flex justify-around items-center bg-slate-100 dark:bg-slate-700/50 p-3 rounded-xl">
            <div className="text-center">
              <div className="text-sm font-bold text-purple-500 dark:text-purple-400">SAVOL</div>
              <div className="text-2xl font-bold">{questionNumber}/{totalQuestions}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-blue-500 dark:text-blue-400">HISOB</div>
              <div className="text-2xl font-bold">{score}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-yellow-500 dark:text-yellow-400">SERIYA</div>
              <div className="text-2xl font-bold flex items-center justify-center">
                {streak} {streak > 0 && <StarIcon className="w-6 h-6 ml-1 text-yellow-400" />}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-center mb-2 font-bold text-slate-600 dark:text-slate-300">Amalni tanlang</h3>
              <div className="flex justify-center gap-2 md:gap-3">
                {/* FIX: Explicitly set the generic type for ControlButton to resolve TypeScript inference issue. */}
                {(Object.values(Operation) as Array<Operation>).map(op => (
                  <ControlButton<Operation> key={op} value={op} label={op} current={operation} setter={setOperation} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-center mb-2 font-bold text-slate-600 dark:text-slate-300">Qiyinlik darajasi</h3>
              <div className="flex justify-center gap-2 md:gap-3">
                {/* FIX: Explicitly set the generic type for ControlButton to resolve TypeScript inference issue. */}
                {(Object.values(Difficulty) as Array<Difficulty>).map(diff => (
                  <ControlButton<Difficulty> key={diff} value={diff} label={diff} current={difficulty} setter={setDifficulty} />
                ))}
              </div>
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-6 min-h-[220px] md:min-h-[250px] flex flex-col justify-center items-center relative transition-all duration-300">
            {problem && (
              <div className={`text-5xl md:text-7xl font-bold text-slate-700 dark:text-slate-200 tracking-wider transition-opacity duration-500 ${isChecking ? 'opacity-20' : 'opacity-100'}`}>
                {problem.num1} {problem.operation} {problem.num2}
              </div>
            )}
            
            <div className={`absolute inset-0 flex justify-center items-center text-3xl font-bold ${feedbackColor} ${feedbackAnimation}`}>
                {feedback !== 'idle' && feedbackMessage}
            </div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="flex flex-col items-center gap-4">
              <input
                  type="number"
                  pattern="\d*"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  disabled={isChecking}
                  placeholder="Javob"
                  className="w-full md:w-3/4 text-center text-3xl font-bold p-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-all"
                  autoFocus
                />
              <button 
                type="submit"
                disabled={isChecking || userAnswer === ''}
                className="w-full md:w-3/4 bg-green-500 hover:bg-green-600 disabled:bg-slate-400 disabled:dark:bg-slate-600 disabled:cursor-not-allowed text-white font-bold text-xl py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Tekshirish
              </button>
            </div>
          </form>
        </div>
        <footer className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Bolalar uchun sevgi bilan yaratilgan.</p>
        </footer>
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-500">
      {!isAuthenticated ? (
        <div className="w-full max-w-md mx-auto bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 text-center animate-pop-in">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-700 dark:text-slate-100">Xush kelibsiz!</h1>
          <p className="text-slate-600 dark:text-slate-300">Ilovani ishga tushirish uchun mahfiy so'zni kiriting.</p>
          <form onSubmit={handleAuthSubmit} className={`flex flex-col items-center gap-4 ${isAuthShaking ? 'animate-shake' : ''}`}>
            <input
              type="password"
              value={secretWordInput}
              onChange={(e) => setSecretWordInput(e.target.value)}
              placeholder="Mahfiy so'z"
              className="w-full md:w-3/4 text-center text-xl p-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              autoFocus
            />
            <button
              type="submit"
              className="w-full md:w-3/4 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xl py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              Kirish
            </button>
          </form>
          {authError && (
            <p className="text-red-500 font-bold mt-4">{authError}</p>
          )}
        </div>
      ) : (
        renderGame()
      )}
    </div>
  );
};

export default App;
