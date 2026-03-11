import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import { startGame } from '../game/main';
import { EventBus } from '../game/EventBus';

export interface IRefPhaserGame {
    game: Phaser.Game | null;
    scene: Phaser.Scene | null;
}

export const PhaserGame = forwardRef<IRefPhaserGame>(function PhaserGame({}, ref) {
    const gameRef = useRef<Phaser.Game | null>(null);

    useLayoutEffect(() => {
        if (gameRef.current === null) {
            gameRef.current = startGame();

            if (typeof ref === 'function') {
                ref({ game: gameRef.current, scene: null });
            } else if (ref) {
                ref.current = { game: gameRef.current, scene: null };
            }
        }

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, [ref]);

    useEffect(() => {
        EventBus.on('current-scene-ready', (scene: Phaser.Scene) => {
            if (typeof ref === 'function') {
                ref({ game: gameRef.current, scene });
            } else if (ref) {
                ref.current = { game: gameRef.current, scene };
            }
        });

        return () => {
            EventBus.removeListener('current-scene-ready');
        };
    }, [ref]);

    return (
        <div id="game-container" className="w-full h-full" />
    );
});
