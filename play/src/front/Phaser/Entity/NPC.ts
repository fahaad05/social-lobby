import type CancelablePromise from "cancelable-promise";
import { PositionMessage_Direction } from "@workadventure/messages";
import type { GameScene } from "../Game/GameScene";
import { Character } from "./Character";
import { lazyLoadPlayerCharacterTextures } from "./PlayerTexturesLoadingManager";
import type { WokaTextureDescriptionInterface } from "./PlayerTextures";

// Pre-composited woka characters (from woka.json "woka" category)
const WOKA_POOL: WokaTextureDescriptionInterface[] = [
    { id: "male1", url: "resources/characters/pipoya/Male 01-1.png" },
    { id: "male2", url: "resources/characters/pipoya/Male 02-2.png" },
    { id: "male3", url: "resources/characters/pipoya/Male 03-4.png" },
    { id: "male4", url: "resources/characters/pipoya/Male 09-1.png" },
    { id: "male5", url: "resources/characters/pipoya/Male 10-3.png" },
    { id: "male6", url: "resources/characters/pipoya/Male 17-2.png" },
    { id: "female1", url: "resources/characters/pipoya/Female 01-1.png" },
    { id: "female2", url: "resources/characters/pipoya/Female 02-2.png" },
    { id: "female3", url: "resources/characters/pipoya/Female 03-4.png" },
    { id: "female4", url: "resources/characters/pipoya/Female 09-1.png" },
    { id: "female5", url: "resources/characters/pipoya/Female 10-2.png" },
    { id: "female6", url: "resources/characters/pipoya/Female 17-1.png" },
];

export interface NPCDef {
    name: string;
    x: number; // pixel x
    y: number; // pixel y
    gender?: "male" | "female";
}

export class NPC extends Character {
    private isAlive = true;

    static spawn(scene: GameScene, def: NPCDef): NPC {
        const pool = def.gender ? WOKA_POOL.filter((w) => w.id.startsWith(def.gender!)) : WOKA_POOL;
        const woka = pool[Math.floor(Math.random() * pool.length)];
        // Ensure unique texture key per NPC instance to avoid animation conflicts
        const uniqueWoka: WokaTextureDescriptionInterface = {
            id: `npc_${woka.id}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            url: woka.url,
        };
        const texturesPromise = lazyLoadPlayerCharacterTextures(scene.superLoad, [uniqueWoka]);
        return new NPC(scene, def.x, def.y, def.name, texturesPromise);
    }

    constructor(scene: GameScene, x: number, y: number, name: string, texturesPromise: CancelablePromise<string[]>) {
        super(scene, x, y, texturesPromise, name, PositionMessage_Direction.DOWN, false, 1, false, undefined);
        this.wanderLoop().catch(console.error);
    }

    private sleep(ms: number): Promise<void> {
        return new Promise<void>((r) => {
            setTimeout(r, ms);
        });
    }

    private async wanderLoop(): Promise<void> {
        const TILE = 32;
        const MAP_W = 43;
        const MAP_H = 23;

        const DIRS = [
            { dir: PositionMessage_Direction.DOWN, dx: 0, dy: TILE },
            { dir: PositionMessage_Direction.UP, dx: 0, dy: -TILE },
            { dir: PositionMessage_Direction.LEFT, dx: -TILE, dy: 0 },
            { dir: PositionMessage_Direction.RIGHT, dx: TILE, dy: 0 },
        ];

        while (this.isAlive && this.active) {
            const { dir, dx, dy } = DIRS[Math.floor(Math.random() * DIRS.length)];
            const steps = 1 + Math.floor(Math.random() * 4);

            for (let i = 0; i < steps; i++) {
                if (!this.isAlive || !this.active || !this.scene) break;

                const nx = this.x + dx;
                const ny = this.y + dy;

                // Stay within safe map bounds
                if (nx <= TILE || nx >= (MAP_W - 2) * TILE || ny <= TILE || ny >= (MAP_H - 2) * TILE) break;

                this.playAnimation(dir, true);

                // eslint-disable-next-line no-await-in-loop
                await new Promise<void>((resolve) => {
                    if (!this.active || !this.scene) {
                        resolve();
                        return;
                    }
                    this.scene.tweens.add({
                        targets: this,
                        x: nx,
                        y: ny,
                        duration: 250,
                        ease: "Linear",
                        onUpdate: () => this.updateUsernameDisplayPosition(),
                        onComplete: () => resolve(),
                    });
                });

                // eslint-disable-next-line no-await-in-loop
                await this.sleep(40);
            }

            // Idle pause facing down
            if (this.isAlive && this.active) {
                this.playAnimation(PositionMessage_Direction.DOWN, false);
                // eslint-disable-next-line no-await-in-loop
                await this.sleep(900 + Math.floor(Math.random() * 1600));
            }
        }
    }

    override destroy(_fromScene?: boolean): void {
        this.isAlive = false;
        super.destroy();
    }
}
