export interface WordinessOption {
    text: string;
    max: number;
  }
  
  export const wordinessOptions: WordinessOption[] = [
    {text: 'a word', max: 1},
    {text: 'a phrase', max: 5},
    {text: 'a long phrase', max: 15},
    {text: 'about twenty words', max: 20},
    {text: 'a lot of words', max: Infinity},
  ];
  