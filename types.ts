
export enum Operation {
  Add = '+',
  Subtract = '−',
  Multiply = '×',
  Divide = '÷',
}

export enum Difficulty {
  Easy = 'Easy',
  Medium = 'Medium',
  Hard = 'Hard',
}

export interface Problem {
  num1: number;
  num2: number;
  operation: Operation;
  answer: number;
}
