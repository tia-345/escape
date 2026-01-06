
import React, { useEffect, useRef, useCallback } from 'react';
import { GameStatus, Player, Teacher, TileType } from '../types';
import { MAZE_LAYOUT, TILE_SIZE, COLORS, SPRITE_SIZE } from '../constants';

interface GameProps {
  status: GameStatus;
  setStatus: (status: GameStatus) => void;
}

const CAMPING_LIMIT_MS = 3000;
const TEACHER_START_X = TILE_SIZE * 17.5;
const TEACHER_START_Y = TILE_SIZE * 10.5;

const Game: React.FC<GameProps> = ({ status, setStatus }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const keys = useRef<{ [key: string]: boolean }>({});
  
  // Using refs to keep the game loop decoupled from React render cycles for maximum performance
  const gameStatusRef = useRef<GameStatus>(status);
  const teacherCampingTimer = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Entities with movement stats
  const playerRef = useRef<Player>({
    x: TILE_SIZE * 1.5,
    y: TILE_SIZE * 1.5,
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
    speed: 180, // pixels per second
    sprintSpeed: 280,
    color: '#333'
  });

  const teacherRef = useRef<Teacher>({
    x: TEACHER_START_X,
    y: TEACHER_START_Y,
    width: SPRITE_SIZE,
    height: SPRITE_SIZE,
    speed: 210, // slightly faster than student base speed
    dirX: 0,
    dirY: 0,
    lastDirChange: 0,
    color: '#475569'
  });

  // Keep the status ref in sync
  useEffect(() => {
    gameStatusRef.current = status;
  }, [status]);

  const initGame = useCallback(() => {
    playerRef.current.x = TILE_SIZE * 1.5 - SPRITE_SIZE / 2;
    playerRef.current.y = TILE_SIZE * 1.5 - SPRITE_SIZE / 2;
    
    teacherRef.current.x = TEACHER_START_X;
    teacherRef.current.y = TEACHER_START_Y;
    
    teacherCampingTimer.current = 0;
    lastTimeRef.current = 0; // Force reset timing on next update
  }, []);

  useEffect(() => {
    if (status === 'START' || status === 'CAUGHT' || status === 'ESCAPED') {
      initGame();
    }
  }, [status, initGame]);

  const checkCollision = (x: number, y: number, width: number, height: number, isTeacher: boolean = false) => {
    // Margin of 6px provides a "narrower" collision box than the sprite, making sliding through 1-tile gaps easier
    const margin = 6; 
    const left = Math.floor((x + margin) / TILE_SIZE);
    const right = Math.floor((x + width - margin) / TILE_SIZE);
    const top = Math.floor((y + margin) / TILE_SIZE);
    const bottom = Math.floor((y + height - margin) / TILE_SIZE);

    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        if (r < 0 || r >= MAZE_LAYOUT.length || c < 0 || c >= MAZE_LAYOUT[0].length) {
          return true;
        }
        const tile = MAZE_LAYOUT[r][c];
        const isSolid = tile === TileType.WALL || 
                        tile === TileType.DESK || 
                        tile === TileType.WINDOW || 
                        tile === TileType.BLACKBOARD;

        // Restriction: Teacher cannot stand on or block the EXIT
        if (isSolid || (isTeacher && tile === TileType.EXIT)) {
          return true;
        }
      }
    }
    return false;
  };

  const drawSprite = (ctx: CanvasRenderingContext2D, entity: Player | Teacher, isPlayer: boolean) => {
    const { x, y, width, height } = entity;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // --- Outfit ---
    if (isPlayer) {
      // Student: White Shirt + School Pants
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(x + 5, y + 10, width - 10, height / 2 - 2);
      ctx.fillStyle = '#374151'; // Darker grey pants
      ctx.fillRect(x + 5, y + 10 + height / 2 - 2, width - 10, height / 2 - 6);
      // Red Tie
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(centerX - 1.5, y + 10, 3, 5);
    } else {
      // Teacher: Professional Navy Suit
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x + 4, y + 10, width - 8, height - 12);
    }

    // --- Face & Skin ---
    ctx.fillStyle = isPlayer ? '#fee2e2' : '#fef08a';
    ctx.beginPath();
    ctx.arc(centerX, y + 8, 8, 0, Math.PI * 2);
    ctx.fill();

    // --- Facial Features ---
    if (isPlayer) {
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(centerX - 4, y + 7, 2, 2);
      ctx.fillRect(centerX + 2, y + 7, 2, 2);
    } else {
      // Teacher Glasses & Angry Expression
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.strokeRect(centerX - 5, y + 6, 4, 4);
      ctx.strokeRect(centerX + 1, y + 6, 4, 4);
      ctx.beginPath();
      ctx.moveTo(centerX - 1, y + 8);
      ctx.lineTo(centerX + 1, y + 8);
      ctx.stroke();
      // Angry red pupils
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(centerX - 3.5, y + 7.5, 1, 1);
      ctx.fillRect(centerX + 2.5, y + 7.5, 1, 1);
    }

    // --- Hair ---
    ctx.fillStyle = isPlayer ? '#451a03' : '#422006';
    if (isPlayer) {
      ctx.fillRect(centerX - 8, y, 16, 4);
    } else {
      ctx.fillRect(centerX - 8, y, 16, 2);
      ctx.fillRect(centerX - 8, y + 2, 3, 5);
      ctx.fillRect(centerX + 5, y + 2, 3, 5);
    }

    // --- Limbs & Prop ---
    ctx.strokeStyle = isPlayer ? '#FFFFFF' : '#1e293b';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    // Left Arm
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 12);
    ctx.lineTo(x - 2, y + 18);
    ctx.stroke();
    // Right Arm
    ctx.beginPath();
    ctx.moveTo(x + width - 5, y + 12);
    ctx.lineTo(x + width + 2, y + 18);
    ctx.stroke();

    if (!isPlayer) {
      // Teacher's Wooden Stick
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + width + 2, y + 18);
      ctx.lineTo(x + width + 14, y + 6);
      ctx.stroke();
      
      if (teacherCampingTimer.current > 1000) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('STAY AWAY!', centerX, y - 12);
      }
    }

    // Legs/Shoes
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 6, y + height - 4, 5, 4);
    ctx.fillRect(x + width - 11, y + height - 4, 5, 4);
  };

  const update = (time: number) => {
    // Handle the first frame and cap large delta jumps
    if (!lastTimeRef.current) {
      lastTimeRef.current = time;
      requestRef.current = requestAnimationFrame(update);
      return;
    }
    
    const delta = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;
    const cappedDelta = Math.min(delta, 0.05); // Cap at 20fps equivalent to prevent jumping through walls

    if (gameStatusRef.current === 'PLAYING') {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        // --- STUDENT INPUT ---
        const player = playerRef.current;
        let pMoveX = 0;
        let pMoveY = 0;
        const pSpeed = (keys.current['Shift'] ? player.sprintSpeed : player.speed);

        if (keys.current['ArrowUp']) pMoveY -= 1;
        if (keys.current['ArrowDown']) pMoveY += 1;
        if (keys.current['ArrowLeft']) pMoveX -= 1;
        if (keys.current['ArrowRight']) pMoveX += 1;

        if (pMoveX !== 0 && pMoveY !== 0) {
          pMoveX *= 0.7071; // Normalize diagonal
          pMoveY *= 0.7071;
        }

        const pdx = pMoveX * pSpeed * cappedDelta;
        const pdy = pMoveY * pSpeed * cappedDelta;

        // Axis-independent collision for smooth wall sliding
        if (!checkCollision(player.x + pdx, player.y, player.width, player.height, false)) {
          player.x += pdx;
        }
        if (!checkCollision(player.x, player.y + pdy, player.width, player.height, false)) {
          player.y += pdy;
        }

        // --- TEACHER INPUT ---
        const teacher = teacherRef.current;
        let tMoveX = 0;
        let tMoveY = 0;
        const tSpeed = teacher.speed;

        if (keys.current['w'] || keys.current['W']) tMoveY -= 1;
        if (keys.current['s'] || keys.current['S']) tMoveY += 1;
        if (keys.current['a'] || keys.current['A']) tMoveX -= 1;
        if (keys.current['d'] || keys.current['D']) tMoveX += 1;

        if (tMoveX !== 0 && tMoveY !== 0) {
          tMoveX *= 0.7071;
          tMoveY *= 0.7071;
        }

        const tdx = tMoveX * tSpeed * cappedDelta;
        const tdy = tMoveY * tSpeed * cappedDelta;

        if (!checkCollision(teacher.x + tdx, teacher.y, teacher.width, teacher.height, true)) {
          teacher.x += tdx;
        }
        if (!checkCollision(teacher.x, teacher.y + tdy, teacher.width, teacher.height, true)) {
          teacher.y += tdy;
        }

        // --- ANTI-CAMP LOGIC ---
        const exitX = 18 * TILE_SIZE + TILE_SIZE / 2;
        const exitY = 13 * TILE_SIZE + TILE_SIZE / 2;
        const tCX = teacher.x + teacher.width / 2;
        const tCY = teacher.y + teacher.height / 2;
        const distToExit = Math.sqrt(Math.pow(tCX - exitX, 2) + Math.pow(tCY - exitY, 2));

        if (distToExit < TILE_SIZE * 2.8) {
          teacherCampingTimer.current += cappedDelta * 1000;
          if (teacherCampingTimer.current > CAMPING_LIMIT_MS) {
            teacher.x = TEACHER_START_X;
            teacher.y = TEACHER_START_Y;
            teacherCampingTimer.current = 0;
          }
        } else {
          // Drain timer when not camping so a quick pass-through doesn't accumulate
          teacherCampingTimer.current = Math.max(0, teacherCampingTimer.current - cappedDelta * 1500);
        }

        // --- GAME OVER CHECKS ---
        const distToPlayer = Math.sqrt(Math.pow(player.x - teacher.x, 2) + Math.pow(player.y - teacher.y, 2));
        if (distToPlayer < 22) { // Tighter collision circle for "caught"
          setStatus('CAUGHT');
        }

        const pCX = player.x + player.width / 2;
        const pCY = player.y + player.height / 2;
        const pTileX = Math.floor(pCX / TILE_SIZE);
        const pTileY = Math.floor(pCY / TILE_SIZE);
        if (MAZE_LAYOUT[pTileY] && MAZE_LAYOUT[pTileY][pTileX] === TileType.EXIT) {
          setStatus('ESCAPED');
        }

        // --- RENDERING ---
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        MAZE_LAYOUT.forEach((row, r) => {
          row.forEach((tile, c) => {
            const tx = c * TILE_SIZE;
            const ty = r * TILE_SIZE;
            switch (tile) {
              case TileType.FLOOR:
              case TileType.ENTRANCE:
                ctx.fillStyle = COLORS.FLOOR;
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                if (tile === TileType.ENTRANCE) {
                  ctx.strokeStyle = COLORS.ENTRANCE;
                  ctx.lineWidth = 4;
                  ctx.strokeRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }
                break;
              case TileType.WALL:
                ctx.fillStyle = COLORS.WALL;
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#d97706';
                ctx.lineWidth = 1;
                ctx.strokeRect(tx, ty, TILE_SIZE, TILE_SIZE);
                break;
              case TileType.DESK:
                ctx.fillStyle = COLORS.FLOOR;
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.DESK;
                ctx.fillRect(tx + 5, ty + 5, TILE_SIZE - 10, TILE_SIZE - 10);
                ctx.fillStyle = '#a16207';
                ctx.fillRect(tx + 5, ty + 5, TILE_SIZE - 10, 4);
                break;
              case TileType.EXIT:
                ctx.fillStyle = COLORS.FLOOR;
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.EXIT;
                ctx.fillRect(tx + 4, ty + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                ctx.fillStyle = 'white';
                ctx.font = 'bold 10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('EXIT', tx + TILE_SIZE / 2, ty + TILE_SIZE / 2 + 5);
                break;
              case TileType.WINDOW:
                ctx.fillStyle = COLORS.WALL;
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.WINDOW;
                ctx.fillRect(tx + 4, ty + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                ctx.strokeStyle = 'white';
                ctx.beginPath();
                ctx.moveTo(tx + 4, ty + TILE_SIZE / 2);
                ctx.lineTo(tx + TILE_SIZE - 4, ty + TILE_SIZE / 2);
                ctx.stroke();
                break;
              case TileType.BLACKBOARD:
                ctx.fillStyle = COLORS.WALL;
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = COLORS.BLACKBOARD;
                ctx.fillRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.beginPath();
                ctx.moveTo(tx + 10, ty + 10);
                ctx.lineTo(tx + 20, ty + 15);
                ctx.stroke();
                break;
            }
          });
        });

        drawSprite(ctx, player, true);
        drawSprite(ctx, teacher, false);
      }
    }

    requestRef.current = requestAnimationFrame(update);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const capturedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Shift', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'];
      if (capturedKeys.includes(e.key)) {
        e.preventDefault();
      }
      keys.current[e.key] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    requestRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center min-h-screen bg-slate-950 overflow-hidden">
      <div className="p-4 bg-slate-800 border-4 border-slate-700 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] scale-90 sm:scale-100">
        <canvas
          ref={canvasRef}
          width={MAZE_LAYOUT[0].length * TILE_SIZE}
          height={MAZE_LAYOUT.length * TILE_SIZE}
          className="rounded-lg shadow-inner bg-[#D2B48C]"
        />
      </div>
      
      <div className="absolute top-8 left-8 flex flex-col gap-2 pointer-events-none">
        <div className="bg-black/70 backdrop-blur px-4 py-2 rounded-full border border-white/20 text-white text-sm font-bold flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${status === 'PLAYING' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
          {status === 'PLAYING' ? 'BATTLE ACTIVE' : 'GAME PAUSED'}
        </div>
        <div className="bg-black/70 backdrop-blur px-4 py-2 rounded-full border border-white/20 text-white text-[10px] tracking-wider flex gap-4 uppercase font-bold">
          <span className="text-blue-400">Student: Arrows + Shift</span>
          <span className="opacity-30">|</span>
          <span className="text-red-400">Teacher: WASD</span>
        </div>
      </div>

      {status === 'PLAYING' && teacherCampingTimer.current > 500 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20 pointer-events-none">
          <div className="bg-red-600 text-white px-8 py-3 rounded-full font-black animate-bounce shadow-2xl border-2 border-white text-lg">
            ANTI-CAMPING! {Math.max(0, Math.ceil((CAMPING_LIMIT_MS - teacherCampingTimer.current) / 1000))}s
          </div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-tastest">Teacher must leave the exit zone</p>
        </div>
      )}
    </div>
  );
};

export default Game;
