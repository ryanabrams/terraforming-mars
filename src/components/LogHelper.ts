import { Game } from "../Game";
import { Player } from "../Player";
import { ICard } from "../cards/ICard";
import { Resources } from "../Resources";
import { ISpace } from "../ISpace";
import { TileType } from "../TileType";
import { IColony } from "../colonies/Colony";
import { MAX_COLONY_TRACK_POSITION } from "../constants";

export class LogHelper {
    static logAddResource(game: Game, player: Player, card: ICard, qty: number = 1): void {
        let resourceType = "resource(s)"

        if (card.resourceType) {
            resourceType = card.resourceType.toLowerCase() + "(s)";
        }

        game.log("${0} added ${1} ${2} to ${3}", b =>
            b.player(player).number(qty).string(resourceType).card(card));
    }

    static logRemoveResource(game: Game, player: Player, card: ICard, qty: number = 1, effect: string): void {
        let resourceType = "resource(s)"

        if (card.resourceType) {
            resourceType = card.resourceType.toLowerCase() + "(s)";
        }

        game.log("${0} removed ${1} ${2} from ${3} to ${4}", b =>
            b.player(player).number(qty).string(resourceType).card(card).string(effect));
    }

    static logGainStandardResource(game: Game, player: Player, resource: Resources, qty: number = 1) {
        game.log("${0} gained ${1} ${2}", b => b.player(player).number(qty).string(resource));
    }

    static logGainProduction(game: Game, player: Player, resource: Resources, qty: number = 1) {
        game.log("${0}'s ${1} production increased by ${2}", b => b.player(player).string(resource).number(qty));
    }

    static logCardChange(game: Game, player: Player, effect: string, qty: number = 1) {
        game.log("${0} ${1} ${2} card(s)", b => b.player(player).string(effect).number(qty));
    }

    static logTilePlacement(game: Game, player: Player, space: ISpace, tileType: TileType) {

        // Skip off-grid tiles
        if (space.x === -1 && space.y === -1) return
        // Skip solo play random tiles
        if (player.name === "neutral") return;

        let type : string;
        let offset: number = Math.abs(space.y - 4);
        let row: number = space.y + 1;
        let position: number = space.x - offset + 1;

        switch (tileType) {
            case TileType.GREENERY:
                type = "greenery";
                break;

            case TileType.CITY:
                type = "city";
                break;

            case TileType.OCEAN:
                type = "ocean";
                break;
        
            default:
                type = "special";
                break;
        }

        game.log("${0} placed ${1} tile on row ${2} position ${3}", b =>
            b.player(player).string(type).number(row).number(position));
    }

    static logColonyTrackIncrease(game: Game, player: Player, colony: IColony) {
        const stepsIncreased = Math.min(player.colonyTradeOffset, MAX_COLONY_TRACK_POSITION - colony.trackPosition);
        
        game.log("${0} increased ${1} colony track ${2} step(s)", b =>
            b.player(player).colony(colony).number(stepsIncreased));
    }

    static logTRIncrease(game: Game, player: Player, steps: number) {
        game.log("${0} gained ${1} TR", b => b.player(player).number(steps));
    }

    static logDiscardedCards(game: Game, discardedCards: Array<ICard>) {
        game.log(discardedCards.length + " card(s) were discarded", b => {
            discardedCards.forEach(card => b.card(card));
        });    
    }
}