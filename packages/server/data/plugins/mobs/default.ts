import Mob from '@kaetram/server/src/game/entity/character/mob/mob';
import Character from '@kaetram/server/src/game/entity/character/character';
import Handler from '@kaetram/server/src/game/entity/character/mob/handler';

import Utils from '@kaetram/common/util/utils';

/**
 * Default handler plugin for the mob. When a mob has a plugin associated
 * with it, instead of loading the default handler, we load the plugin with
 * callback functions special to the mob.
 */

export default class Default extends Handler {
    // Support for minion spawning. Since a lot of bosses may spawn minions.
    protected minions: { [instance: string]: Mob } = {};

    public constructor(mob: Mob) {
        super(mob);
    }

    /**
     * Creates a mob given the key and position, and creates the necessary callbacks
     * and handlers for its death.
     * @param key The key of the mob to spawn.
     * @param x The x grid coordinate to spawn the mob at.
     * @param y The y grid coordinate to spawn the mob at.
     * @returns The spawned minion object.
     */

    protected spawn(key: string, x: number, y: number): Mob {
        let minion = this.world.entities.spawnMob(key, x, y);

        // Prevent minion from respawning after death.
        minion.respawnable = false;

        // Remove the minion from the list when it dies.
        minion.onDeathImpl(() => delete this.minions[minion.instance]);

        // Add the minion to the list.
        this.minions[minion.instance] = minion;

        return minion;
    }

    /**
     * Grabs a target from the mob's attackers list.
     * @returns A character object if a target was found, otherwise undefined.
     */

    protected getTarget(): Character | undefined {
        // Skip if no attackers but somehow the boss got hit.
        if (this.mob.attackers.length === 0) return;

        // Find an attacker out of the list of attackers.
        let target = this.mob.attackers[Utils.randomInt(0, this.mob.attackers.length - 1)];

        return target;
    }
}
