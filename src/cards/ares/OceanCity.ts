import { CardName } from "../../CardName";
import { Game } from "../../Game";
import { SelectSpace } from "../../inputs/SelectSpace";
import { ISpace } from "../../ISpace";
import { Player } from "../../Player";
import { Resources } from "../../Resources";
import { SpaceBonus } from "../../SpaceBonus";
import { TileType } from "../../TileType";
import { CardType } from "./../CardType";
import { IProjectCard } from "./../IProjectCard";
import { Tags } from "./../Tags";

// TODO(kberg): Make ocean city act like a city.
//   Player.getCitiesCount
//   Game.getCitiesInPlayOnMars
//   Board.isCitySpace
export class OceanCity implements IProjectCard {
  public cost: number = 18;
  public tags: Array<Tags> = [Tags.CITY, Tags.STEEL];
  public cardType: CardType = CardType.AUTOMATED;
  public name: CardName = CardName.OCEAN_CITY;

  public canPlay(player: Player, game: Game): boolean {
    return game.board.getOceansOnBoard() >= 6 - player.getRequirementsBonus(game);
  }

  public play(player: Player, game: Game) {
    player.setProduction(Resources.ENERGY, -1);
    player.setProduction(Resources.MEGACREDITS, 3);

    // TODO(kberg): deal with covering ocean spaces.
    return new SelectSpace(
      "Select space for Ocean City",
      // TODO(kberg): Oceans with tiles on them can't be placed, either.
      game.board.getOceansTiles(),
      (space: ISpace) => {
        game.addTile(player, space.spaceType, space, {
          tileType: TileType.OCEAN_CITY,
          card: this.name
        });
        space.adjacency = { bonus: [SpaceBonus.PLANT] }
        return undefined;
      }
    );
  }
}