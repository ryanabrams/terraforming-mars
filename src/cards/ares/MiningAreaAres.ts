import { CardName } from "../../CardName";
import { ISpace } from "../../ISpace";
import { SpaceBonus } from "../../SpaceBonus";
import { MiningArea } from "../MiningArea";

export class MiningAreaAres extends MiningArea {
  public name: CardName = CardName.MINING_AREA_ARES;

  protected addAdjacencyBonus(space: ISpace, bonusType: SpaceBonus) {
    space.adjacency = { bonus: [bonusType] };
  }
}