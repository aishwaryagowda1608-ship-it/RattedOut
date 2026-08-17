import React, { useRef, useEffect } from 'react';
import { DeadBody, Player, SabotageState, TaskDefinition } from '../types';
import {
  MAP_ROOMS,
  MAP_CORRIDORS,
  MAP_VENTS,
  TASK_STATIONS,
  EMERGENCY_BUTTON_POS,
  ADMIN_TABLE_POS,
  SECURITY_DESK_POS,
  PLAYER_COLORS,
} from '../utils/mapData';

interface Props {
  players: Player[];
  localPlayer: Player;
  deadBodies: DeadBody[];
  sabotage: SabotageState;
  nearbyTask: TaskDefinition | null;
  nearbyBody: DeadBody | null;
  nearbyVent: string | null;
  nearbyKillTarget: Player | null;
  canCallEmergency: boolean;
  canUseAdmin: boolean;
  canUseSecurity: boolean;
  canFixSabotage: boolean;
  colorblindMode?: boolean;
  onCanvasClick?: (worldX: number, worldY: number) => void;
}

export const GameCanvas: React.FC<Props> = ({
  players,
  localPlayer,
  deadBodies,
  sabotage,
  nearbyTask,
  nearbyBody,
  nearbyVent,
  nearbyKillTarget,
  canCallEmergency,
  canUseAdmin,
  canUseSecurity,
  canFixSabotage,
  colorblindMode = false,
  onCanvasClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Camera follows local player
      const cameraX = width / 2 - localPlayer.x;
      const cameraY = height / 2 - localPlayer.y;

      ctx.save();
      ctx.translate(cameraX, cameraY);

      // 1. Draw Space background grid
      ctx.fillStyle = '#EEF2F6';
      ctx.fillRect(-200, -200, 2000, 1500);

      // Station outer hull boundary glow
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = -200; x < 2000; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, -200);
        ctx.lineTo(x, 1500);
        ctx.stroke();
      }
      for (let y = -200; y < 1500; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-200, y);
        ctx.lineTo(2000, y);
        ctx.stroke();
      }

      // 2. Draw Corridors (floors)
      MAP_CORRIDORS.forEach((c) => {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(c.x, c.y, c.width, c.height);

        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 2;
        ctx.strokeRect(c.x, c.y, c.width, c.height);
      });

      // 3. Draw Rooms (Floors & Architectural Walls)
      MAP_ROOMS.forEach((room) => {
        // Floor
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(room.x, room.y, room.width, room.height, 24);
        ctx.fill();

        // Floor tiles pattern
        ctx.strokeStyle = '#F1F5F9';
        ctx.lineWidth = 1;
        for (let rx = room.x + 30; rx < room.x + room.width; rx += 30) {
          ctx.beginPath();
          ctx.moveTo(rx, room.y);
          ctx.lineTo(rx, room.y + room.height);
          ctx.stroke();
        }
        for (let ry = room.y + 30; ry < room.y + room.height; ry += 30) {
          ctx.beginPath();
          ctx.moveTo(room.x, ry);
          ctx.lineTo(room.x + room.width, ry);
          ctx.stroke();
        }

        // Room Wall Border
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.roundRect(room.x, room.y, room.width, room.height, 24);
        ctx.stroke();

        // Room Label
        ctx.fillStyle = '#64748B';
        ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(room.name.toUpperCase(), room.x + room.width / 2, room.y + 30);
      });

      // 4. Draw Vents
      MAP_VENTS.forEach((vent) => {
        ctx.save();
        ctx.translate(vent.x, vent.y);

        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.roundRect(-16, -12, 32, 24, 6);
        ctx.fill();

        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = 2;
        for (let i = -10; i <= 10; i += 5) {
          ctx.beginPath();
          ctx.moveTo(i, -8);
          ctx.lineTo(i, 8);
          ctx.stroke();
        }

        // If local player is Impostor, highlight nearby vent
        if (localPlayer.role.includes('IMPOSTOR')) {
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-18, -14, 36, 28, 8);
          ctx.stroke();
        }

        ctx.restore();
      });

      // 5. Draw Interactive Consoles & Tables
      // Emergency Table in Cafeteria
      ctx.save();
      ctx.translate(EMERGENCY_BUTTON_POS.x, EMERGENCY_BUTTON_POS.y);
      ctx.fillStyle = '#E2E8F0';
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 36, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Red emergency button
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#B91C1C';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Pulse ring if in range
      if (canCallEmergency) {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, 48, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();

      // Admin Table
      ctx.save();
      ctx.translate(ADMIN_TABLE_POS.x, ADMIN_TABLE_POS.y);
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.roundRect(-24, -14, 48, 28, 6);
      ctx.fill();
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect(-20, -10, 40, 20);
      ctx.restore();

      // Security Desk
      ctx.save();
      ctx.translate(SECURITY_DESK_POS.x, SECURITY_DESK_POS.y);
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.roundRect(-24, -14, 48, 28, 6);
      ctx.fill();
      ctx.fillStyle = '#4ADE80';
      ctx.fillRect(-20, -10, 40, 20);
      ctx.restore();

      // 6. Draw Task Stations
      TASK_STATIONS.forEach((station) => {
        // Check if player has this task
        const playerHasTask = localPlayer.tasks?.some((t) => t.name === station.name && !t.completed);

        ctx.save();
        ctx.translate(station.x, station.y);

        // Base console
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(-12, -12, 24, 24, 6);
        ctx.fill();

        // Screen
        ctx.fillStyle = playerHasTask ? '#FBBF24' : '#94A3B8';
        ctx.beginPath();
        ctx.roundRect(-9, -9, 18, 18, 4);
        ctx.fill();

        // Pulsing yellow highlight if player is doing this task
        if (playerHasTask) {
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 18, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      });

      // 7. Draw Dead Bodies
      deadBodies.forEach((body) => {
        const colorDef = PLAYER_COLORS[body.victimColor];
        const isNearby = nearbyBody && nearbyBody.id === body.id;
        ctx.save();
        ctx.translate(body.x, body.y);

        // Highlight ring if in report proximity
        if (isNearby && !localPlayer.isDead) {
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.ellipse(0, 0, 26, 18, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Floating REPORT badge
          ctx.fillStyle = '#D97706';
          ctx.beginPath();
          ctx.roundRect(-24, -36, 48, 16, 8);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 8.5px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('REPORT [R]', 0, -28);
        }

        // Lower body capsule on ground
        ctx.fillStyle = colorDef ? colorDef.primary : '#EF4444';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bone marker sticking out
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-3, -16, 6, 12);
        ctx.beginPath();
        ctx.arc(-3, -16, 3.5, 0, Math.PI * 2);
        ctx.arc(3, -16, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // 8. Draw Players
      players.forEach((p) => {
        if (p.isVenting) return; // Hide venting players

        const isLocal = p.id === localPlayer.id;
        const colorDef = PLAYER_COLORS[p.color] || PLAYER_COLORS.coral;
        const isGhost = p.isDead;

        // Skip other dead ghosts if local player is alive
        if (isGhost && !localPlayer.isDead && !isLocal) return;

        ctx.save();
        ctx.translate(p.x, p.y);

        // Ghost opacity
        if (isGhost) {
          ctx.globalAlpha = 0.55;
        }

        // Target reticle if this player is the nearby kill target for local impostor
        const isKillTarget =
          nearbyKillTarget &&
          p.id === nearbyKillTarget.id &&
          localPlayer.role.includes('IMPOSTOR') &&
          !localPlayer.isDead;

        if (isKillTarget) {
          ctx.strokeStyle = '#EF4444';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 2]);
          ctx.beginPath();
          ctx.arc(0, 0, 26, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Crosshair markers
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(-2, -32, 4, 6);
          ctx.fillRect(-2, 26, 4, 6);
          ctx.fillRect(-32, -2, 6, 4);
          ctx.fillRect(26, -2, 6, 4);

          // Target tag above name
          ctx.fillStyle = '#DC2626';
          ctx.beginPath();
          ctx.roundRect(-22, -44, 44, 14, 6);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 8px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('TARGET [Q]', 0, -37);
        }

        // Soft drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.beginPath();
        ctx.ellipse(0, 16, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Backpack
        ctx.fillStyle = colorDef.shadow;
        const backpackOffset = p.facing === 'left' ? 10 : -14;
        ctx.beginPath();
        ctx.roundRect(backpackOffset, -10, 8, 20, 3);
        ctx.fill();

        // Main Astronaut Body
        ctx.fillStyle = colorDef.primary;
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2.5;

        // Walking vertical bob
        const bob = p.isMoving ? Math.sin(Date.now() / 100) * 2 : 0;

        ctx.beginPath();
        ctx.roundRect(-12, -18 + bob, 24, 32, 12);
        ctx.fill();
        ctx.stroke();

        // Legs / Split
        if (!isGhost) {
          ctx.fillStyle = colorDef.primary;
          ctx.fillRect(-10, 10 + bob, 7, 8);
          ctx.fillRect(3, 10 + bob, 7, 8);
          ctx.strokeRect(-10, 10 + bob, 7, 8);
          ctx.strokeRect(3, 10 + bob, 7, 8);
        }

        // Glass Visor
        ctx.fillStyle = colorDef.visor;
        ctx.strokeStyle = '#1E293B';
        ctx.lineWidth = 2;
        const visorX = p.facing === 'left' ? -12 : 0;

        ctx.beginPath();
        ctx.roundRect(visorX, -14 + bob, 14, 10, 5);
        ctx.fill();
        ctx.stroke();

        // Glint on visor
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(visorX + 2, -12 + bob, 5, 2.5, 1);
        ctx.fill();

        // Colorblind Symbol Badge on Suit Chest
        if (colorblindMode && colorDef.symbol) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
          ctx.beginPath();
          ctx.arc(p.facing === 'left' ? 4 : -4, 2 + bob, 6.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.font = '900 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(colorDef.symbol, p.facing === 'left' ? 4 : -4, 2.5 + bob);
        }

        // Name tag
        ctx.fillStyle = '#1E293B';
        ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(p.name, 0, -26 + bob);

        // Highlight local player
        if (isLocal) {
          ctx.strokeStyle = '#6366F1';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0 + bob, 24, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      });

      // 9. Vision Radius / Fog of War (Minimalist light theme vignette)
      ctx.restore(); // Exit camera space

      // Draw light vision mask
      const isImpostor = localPlayer.role.includes('IMPOSTOR');
      const isLightsSabotaged = sabotage.activeType === 'LIGHTS';
      const baseRadius = isImpostor ? 320 : isLightsSabotaged ? 140 : 260;

      const visionGradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        baseRadius * 0.7,
        width / 2,
        height / 2,
        baseRadius * 1.5
      );
      visionGradient.addColorStop(0, 'rgba(248, 249, 250, 0)');
      visionGradient.addColorStop(1, isLightsSabotaged && !isImpostor ? 'rgba(15, 23, 42, 0.88)' : 'rgba(226, 232, 240, 0.45)');

      ctx.fillStyle = visionGradient;
      ctx.fillRect(0, 0, width, height);

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animFrameId);
  }, [
    players,
    localPlayer,
    deadBodies,
    sabotage,
    nearbyTask,
    nearbyBody,
    nearbyVent,
    nearbyKillTarget,
    canCallEmergency,
  ]);

  // Handle click on canvas to move or interact
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onCanvasClick) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cameraX = canvas.width / 2 - localPlayer.x;
    const cameraY = canvas.height / 2 - localPlayer.y;

    const worldX = clickX - cameraX;
    const worldY = clickY - cameraY;

    onCanvasClick(worldX, worldY);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#EEF2F6]">
      <canvas
        ref={canvasRef}
        width={960}
        height={640}
        onClick={handleClick}
        className="w-full h-full max-w-5xl max-h-[80vh] rounded-3xl shadow-xl border border-slate-200 cursor-crosshair"
      />
    </div>
  );
};
