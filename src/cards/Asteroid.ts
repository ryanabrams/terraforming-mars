import {IProjectCard} from './IProjectCard';
import {Tags} from './Tags';
import {CardType} from './CardType';
import {Player} from '../Player';
import {Game} from '../Game';
import {SelectPlayer} from '../inputs/SelectPlayer';

export class Asteroid implements IProjectCard {
    public cost: number = 14;
    public nonNegativeVPIcon: boolean = true;
    public tags: Array<Tags> = [Tags.SPACE];
    public name: string = 'Asteroid';
    public cardType: CardType = CardType.EVENT;
    public text: string = 'Raise temperature 1 step and gain 2 titanium.' +
      'Remove up to 3 plants from any player';
    public requirements: undefined;
    public description: string =
      'What are those plants doing in our impact zone?';
    public canPlay(): boolean {
      return true;
    }
    public play(player: Player, game: Game) {
      if (game.getPlayers().length == 1) {
        player.titanium += 2;
        return game.increaseTemperature(player, 1);
      }
      return new SelectPlayer(
          game.getPlayers(),
          'Select player to remove 3 plants from',
          (foundPlayer: Player) => {
            foundPlayer.removePlants(player, 3);
            player.titanium += 2;
            return game.increaseTemperature(player, 1);
          }
      );
    }
}