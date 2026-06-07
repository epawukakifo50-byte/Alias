import standard from './standard.json';
import hard from './hard.json';
import games from './games.json';
import game_titles from './game_titles.json';
import cartoons from './cartoons.json';
import movies from './movies.json';
import literature from './literature.json';
import geography from './geography.json';
import chemistry from './chemistry.json';
import mythology from './mythology.json';
import clothes from './clothes.json';
import space from './space.json';
import animals from './animals.json';

export interface WordPack {
  id: string;
  name: string;
  words: string[];
}

export const packs: Record<string, WordPack> = {
  standard,
  hard,
  games,
  game_titles,
  cartoons,
  movies,
  literature,
  geography,
  chemistry,
  mythology,
  clothes,
  space,
  animals
};
