import { IActionCard } from "./ICard";
import { IProjectCard } from "./IProjectCard";
import { Tags } from "./Tags";
import { CardType } from "./CardType";
import { Player } from "../Player";
import { Game } from "../Game";
import { TileType } from "../TileType";
import { SelectSpace } from "../inputs/SelectSpace";
import { ISpace } from "../ISpace";
import { Resources } from '../Resources';
import { CardName } from '../CardName';
import { Board } from "../Board";

export class IndustrialCenter implements IActionCard, IProjectCard {
    public cost: number = 4;
    public tags: Array<Tags> = [Tags.STEEL];
    public cardType: CardType = CardType.ACTIVE;
    public name: CardName = CardName.INDUSTRIAL_CENTER;
    public hasRequirements = false;
    private getAvailableSpaces(player: Player, game: Game): Array<ISpace> {
        return game.board.getAvailableSpacesOnLand(player)
                .filter((space) => game.board.getAdjacentSpaces(space).filter((adjacentSpace) => Board.isCitySpace(adjacentSpace)).length > 0);
    }
    public canPlay(player: Player, game: Game): boolean {
        return this.getAvailableSpaces(player, game).length > 0;
    }
    public play(player: Player, game: Game) {
        return new SelectSpace("Select space adjacent to a city tile", this.getAvailableSpaces(player, game), (foundSpace: ISpace) => {
            game.addTile(player, foundSpace.spaceType, foundSpace, { tileType: TileType.INDUSTRIAL_CENTER });
            return undefined;
        });
    }
    public canAct(player: Player): boolean {
        return player.canAfford(7);
    }
    public action(player: Player, game: Game) {
        game.addSelectHowToPayInterrupt(player, 7, false, false, "Select how to pay for action");
        player.setProduction(Resources.STEEL);
        return undefined;
    }
}

