import { Packets, Opcodes } from '@kaetram/common/network';

import Character from './character/character';

import type EntitiesController from '../controllers/entities';
import type Game from '../game';

export default class EntityHandler {
    private game!: Game;
    private entities!: EntitiesController;

    public constructor(private entity: Character) {}

    public load(game: Game): void {
        this.setGame(game);

        if ((!this.entity || !game) && !(this.entity instanceof Character)) return;

        this.entity.onRequestPath((x, y) => {
            if (this.entity.gridX === x && this.entity.gridY === y) return [];

            return game.findPath(this.entity, x, y);
        });

        this.entity.onBeforeStep(() => this.entities.unregisterPosition(this.entity));

        this.entity.onStep(() => {
            this.entities.registerPosition(this.entity);

            this.entity.forEachAttacker((attacker: Character) => {
                if (!attacker.target) return;

                if (attacker.target.instance !== this.entity.instance)
                    return this.entity.removeAttacker(attacker);

                attacker.follow(this.entity);
            });

            this.sendMovement();

            if (
                this.entity.hasTarget() &&
                this.entity.getDistance(this.entity.target!) <= this.entity.attackRange
            )
                this.entity.stop(true);
        });

        this.entity.onStopPathing(() => this.sendMovement());

        this.entity.ready = true;
    }

    public setGame(game: Game): void {
        this.game ||= game;

        this.setEntities(this.game.entities);
    }

    private setEntities(entities: EntitiesController): void {
        this.entities ||= entities;
    }

    /**
     * Sends a movement update to the server.
     */

    private sendMovement(): void {
        let { entity, game } = this;

        if (entity.isMob() && (entity.hasAttackers() || entity.hasTarget()))
            game.socket.send(Packets.Movement, {
                opcode: Opcodes.Movement.Entity,
                targetInstance: entity.instance,
                requestX: entity.gridX,
                requestY: entity.gridY
            });
    }
}
