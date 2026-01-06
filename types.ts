
export type GameStatus = 'START' | 'PLAYING' | 'CAUGHT' | 'ESCAPED';

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface Player extends Entity {
  speed: number;
  sprintSpeed: number;
}

export interface Teacher extends Entity {
  speed: number;
  dirX: number;
  dirY: number;
  lastDirChange: number;
}

export enum TileType {
  FLOOR = 0,
  WALL = 1,
  DESK = 2,
  ENTRANCE = 3,
  EXIT = 4,
  WINDOW = 5,
  BLACKBOARD = 6
}
