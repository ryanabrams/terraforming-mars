// Simple sanity test for the moment.

import { expect } from "chai";
import { AresHandler } from "../../src/ares/AresHandler";
import { SpaceBonus } from "../../src/SpaceBonus";
import { AresSpaceBonus } from "../../src/ares/AresSpaceBonus";
import { Player } from "../../src/Player";
import { Game } from "../../src/Game";
import { Color } from "../../src/Color";
import { ARES_OPTIONS_NO_HAZARDS, AresTestHelper, ARES_OPTIONS_WITH_HAZARDS } from "./AresTestHelper";
import { EmptyBoard } from "./EmptyBoard";
import { TileType } from "../../src/TileType";
import { ITile } from "../../src/ITile";
import { SpaceType } from "../../src/SpaceType";
import { Resources } from "../../src/Resources";
import { SelectProductionToLoseInterrupt } from "../../src/interrupts/SelectProductionToLoseInterrupt";
import { SelectProductionToLose } from "../../src/inputs/SelectProductionToLose";
import { IProductionUnits } from "../../src/inputs/IProductionUnits";

describe("AresHandler", function () {
    let player : Player, otherPlayer: Player, game : Game;

    beforeEach(function() {
      player = new Player("test", Color.BLUE, false);
      otherPlayer = new Player("other", Color.RED, false);
      game = new Game("foobar", [player, otherPlayer], player, ARES_OPTIONS_NO_HAZARDS);
      game.board = new EmptyBoard();
    });
  
  
    it("NotIsAresSpaceBonus", function () {
        expect(AresHandler.isAresSpaceBonus(SpaceBonus.TITANIUM)).is.false;
        expect(AresHandler.isAresSpaceBonus(SpaceBonus.STEEL)).is.false;
        expect(AresHandler.isAresSpaceBonus(SpaceBonus.PLANT)).is.false;
        expect(AresHandler.isAresSpaceBonus(SpaceBonus.DRAW_CARD)).is.false;
        expect(AresHandler.isAresSpaceBonus(SpaceBonus.HEAT)).is.false;
        expect(AresHandler.isAresSpaceBonus(SpaceBonus.OCEAN)).is.false;
    });

    it("IsAresSpaceBonus", function () {
        expect(AresHandler.isAresSpaceBonus(AresSpaceBonus.ANIMAL)).is.true;
        expect(AresHandler.isAresSpaceBonus(AresSpaceBonus.MEGACREDITS)).is.true;
        expect(AresHandler.isAresSpaceBonus(AresSpaceBonus.MICROBE)).is.true;
        expect(AresHandler.isAresSpaceBonus(AresSpaceBonus.POWER)).is.true;
    });

    it("Get adjacency bonus", function() {
        var firstSpace = game.board.getAvailableSpacesOnLand(player)[0];
        firstSpace.adjacency = { bonus: [ SpaceBonus.DRAW_CARD ] };
        game.addTile(otherPlayer, SpaceType.LAND, firstSpace, {tileType: TileType.RESTRICTED_AREA});
        
        player.megaCredits = 0;
        player.cardsInHand = [];
        otherPlayer.megaCredits = 0;
        otherPlayer.cardsInHand = [];

        var adjacentSpace = game.board.getAdjacentSpaces(firstSpace)[0];
        game.addTile(player, adjacentSpace.spaceType, adjacentSpace, {tileType: TileType.GREENERY});

        // player who placed next to Restricted area gets a card, but no money.
        expect(player.megaCredits).is.eq(0);
        expect(player.cardsInHand).is.length(1);

        // player who owns Restricted area gets money, but no card.
        expect(otherPlayer.megaCredits).is.eq(1);
        expect(otherPlayer.cardsInHand).is.length(0);
    });

    it("setupHazards", function() {
        // front-load the deck with cards of predtermined costs.
        // four player game places two dust storms.

        // Even though there's already a game, with a board, that laid out hazards, this is going to use a clean set-up.

        var deck = game.dealer.deck;
        deck[deck.length - 1].cost = 5;
        deck[deck.length - 2].cost = 3;
        game.board.spaces.forEach(space => { space.tile = undefined; space.player = undefined });

        AresHandler.setupHazards(game, 4);

        interface SpaceToTest {
            tile: ITile;
            x: number;
            y: number;
        }
        var spacesWithTiles: Array<SpaceToTest> = game.board.spaces
            .filter(space => space.tile !== undefined)
            .map(space => {var x: SpaceToTest = {tile: space.tile!, x: space.x, y: space.y}; return x});

        expect(spacesWithTiles).to.deep.eq([
            {tile: {tileType: TileType.DUST_STORM_MILD, hazard: true}, x: 8, y: 0},
            {tile: {tileType: TileType.DUST_STORM_MILD, hazard: true}, x: 6, y: 8}]);
   });

    it("Pay Adjacency Costs", function() {
        var firstSpace = game.board.getAvailableSpacesOnLand(player)[0];
        firstSpace.adjacency = { bonus: [ ], cost: 2 };
        game.addTile(otherPlayer, SpaceType.LAND, firstSpace, {tileType: TileType.NUCLEAR_ZONE});

        player.megaCredits = 2;
        otherPlayer.megaCredits = 0;

        var adjacentSpace = game.board.getAdjacentSpaces(firstSpace)[0];
        game.addTile(player, adjacentSpace.spaceType, adjacentSpace, {tileType: TileType.GREENERY});

        // player who placed next to Nuclear zone, loses two money.
        expect(player.megaCredits).is.eq(0);

        // player who owns Nuclear zone doesn't get an adjacency bonus.
        expect(otherPlayer.megaCredits).is.eq(0);
    })

    it("Can't afford adjacency costs", function() {
        var firstSpace = game.board.getAvailableSpacesOnLand(player)[0];
        firstSpace.adjacency = { bonus: [ ], cost: 2 };
        game.addTile(otherPlayer, SpaceType.LAND, firstSpace, {tileType: TileType.NUCLEAR_ZONE});

        otherPlayer.megaCredits = 0;

        var adjacentSpace = game.board.getAdjacentSpaces(firstSpace)[0];

        try {
            game.addTile(player, adjacentSpace.spaceType, adjacentSpace, {tileType: TileType.GREENERY});
        } catch(err) {
            expect(err.toString().includes("Placing here costs 2 M€")).is.true;
        }
    });

    it("Pay adjacent hazard costs - mild", function() {
        var firstSpace = game.board.getAvailableSpacesOnLand(player)[0];
        AresHandler.putHazardAt(firstSpace, TileType.DUST_STORM_MILD);

        // No resources available to play the tile.
        player.setProduction(Resources.MEGACREDITS, -5);

        var adjacentSpace = game.board.getAdjacentSpaces(firstSpace)[0];
        try {
            game.addTile(player, adjacentSpace.spaceType, adjacentSpace, {tileType: TileType.GREENERY});
        } catch(err) {
            expect(err.toString()).includes("Placing here costs 1 units of production");
        }

        player.setProduction(Resources.PLANTS, 7);
        game.addTile(player, adjacentSpace.spaceType, adjacentSpace, {tileType: TileType.GREENERY});
        expect(game.interrupts).has.lengthOf(1);
        expect(game.interrupts[0]).instanceOf(SelectProductionToLoseInterrupt);

        var interrupt = game.interrupts[0] as SelectProductionToLoseInterrupt;
        var input = interrupt.playerInput as SelectProductionToLose;
        expect(input.unitsToLose).eq(1);
        input.cb({ plants: 1 } as IProductionUnits)
        expect(player.getProduction(Resources.PLANTS)).eq(6);
    });

    it("pay adjacent hazard costs - severe", function() {
        var firstSpace = game.board.getAvailableSpacesOnLand(player)[0];
        AresHandler.putHazardAt(firstSpace, TileType.DUST_STORM_SEVERE); 

        // No resources available to play the tile.
        player.setProduction(Resources.MEGACREDITS, -5);

        var adjacentSpace = game.board.getAdjacentSpaces(firstSpace)[0];
        try {
            game.addTile(player, adjacentSpace.spaceType, adjacentSpace, {tileType: TileType.GREENERY});
        } catch(err) {
            expect(err.toString()).includes("Placing here costs 2 units of production");
        }

        player.setProduction(Resources.PLANTS, 7);
        game.addTile(player, adjacentSpace.spaceType, adjacentSpace, {tileType: TileType.GREENERY});
        expect(game.interrupts).has.lengthOf(1);
        expect(game.interrupts[0]).instanceOf(SelectProductionToLoseInterrupt);

        var interrupt = game.interrupts[0] as SelectProductionToLoseInterrupt;
        var input = interrupt.playerInput as SelectProductionToLose;
        expect(input.unitsToLose).eq(2);
        input.cb({ plants: 2 } as IProductionUnits)
        expect(player.getProduction(Resources.PLANTS)).eq(5);
    });

    it("cover mild hazard", function() {
        var space = game.board.getAvailableSpacesOnLand(player)[0];
        AresHandler.putHazardAt(space, TileType.EROSION_MILD);
        player.megaCredits = 8;
        expect(player.getTerraformRating()).eq(20);

        game.addTile(player, space.spaceType, space, {tileType: TileType.GREENERY});

        expect(space.tile!.tileType).eq(TileType.GREENERY);
        expect(player.megaCredits).is.eq(0);
        expect(player.getTerraformRating()).eq(21);
    });

    it("cover severe hazard", function() {
        var space = game.board.getAvailableSpacesOnLand(player)[0];
        AresHandler.putHazardAt(space, TileType.EROSION_SEVERE);
        player.megaCredits = 16;
        expect(player.getTerraformRating()).eq(20);

        game.addTile(player, space.spaceType, space, {tileType: TileType.GREENERY});

        expect(space.tile!.tileType).eq(TileType.GREENERY);
        expect(player.megaCredits).is.eq(0);
        expect(player.getTerraformRating()).eq(22);
    });

    it("erosion appears after the third ocean", function() {
        game = new Game("foobar", [player, otherPlayer], player, ARES_OPTIONS_WITH_HAZARDS);
        AresTestHelper.addOcean(game, player);
        AresTestHelper.addOcean(game, player);

        var tiles = AresTestHelper.byTileType(AresTestHelper.getHazards(game));
        expect(tiles.get(TileType.EROSION_MILD)).has.lengthOf(0);
       
        AresTestHelper.addOcean(game, player);

        tiles = AresTestHelper.byTileType(AresTestHelper.getHazards(game));
        expect(tiles.get(TileType.EROSION_MILD)).has.lengthOf(2);
    });

    it("dust storms disappear after the sixth ocean", function() {
        game = new Game("foobar", [player, otherPlayer], player, ARES_OPTIONS_WITH_HAZARDS);
        AresTestHelper.addOcean(game, player);
        AresTestHelper.addOcean(game, player);
        AresTestHelper.addOcean(game, player);
        AresTestHelper.addOcean(game, player);
        AresTestHelper.addOcean(game, player);
 
        var tiles = AresTestHelper.byTileType(AresTestHelper.getHazards(game));
        expect(tiles.get(TileType.DUST_STORM_MILD)).has.lengthOf(3);
        expect(tiles.get(TileType.DUST_STORM_SEVERE)).has.lengthOf(0);
        var prior = player.getTerraformRating();

        AresTestHelper.addOcean(game, player);

        tiles = AresTestHelper.byTileType(AresTestHelper.getHazards(game));
        expect(tiles.get(TileType.DUST_STORM_MILD)).has.lengthOf(0);
        expect(tiles.get(TileType.DUST_STORM_SEVERE)).has.lengthOf(0);
        expect(player.getTerraformRating()).eq(prior + 2); // One for the ocean, once for the dust storm event.
     });

    it("dust storms amplify at 5% oxygen", function() {
        game = new Game("foobar", [player, otherPlayer], player, ARES_OPTIONS_WITH_HAZARDS);
        while (game.getOxygenLevel() < 4) {
            game.increaseOxygenLevel(player, 1);
        }

        var tiles = AresTestHelper.byTileType(AresTestHelper.getHazards(game));
        expect(tiles.get(TileType.DUST_STORM_MILD)).has.lengthOf(3);
        expect(tiles.get(TileType.DUST_STORM_SEVERE)).has.lengthOf(0);
        
        game.increaseOxygenLevel(player, 1);
 
        tiles = AresTestHelper.byTileType(AresTestHelper.getHazards(game));
        expect(tiles.get(TileType.DUST_STORM_MILD)).has.lengthOf(0);
        expect(tiles.get(TileType.DUST_STORM_SEVERE)).has.lengthOf(3);
    });

    it("erosions amplify at -4C", function() {
        game = new Game("foobar", [player, otherPlayer], player, ARES_OPTIONS_WITH_HAZARDS);
        while (game.getTemperature() < -6) {
            game.increaseTemperature(player, 1);
        }
        AresTestHelper.addOcean(game, player);
        AresTestHelper.addOcean(game, player);
        AresTestHelper.addOcean(game, player);

        var tiles = AresTestHelper.byTileType(AresTestHelper.getHazards(game));
        expect(tiles.get(TileType.EROSION_MILD)).has.lengthOf(2);
        expect(tiles.get(TileType.EROSION_SEVERE)).has.lengthOf(0);
        
        game.increaseTemperature(player, 1);
 
        tiles = AresTestHelper.byTileType(AresTestHelper.getHazards(game));
        expect(tiles.get(TileType.EROSION_MILD)).has.lengthOf(0);
        expect(tiles.get(TileType.EROSION_SEVERE)).has.lengthOf(2);
     });

    it("severe erosions appear at third ocean when temperature passes -4C", function() {
        game = new Game("foobar", [player, otherPlayer], player, ARES_OPTIONS_WITH_HAZARDS);
        while (game.getTemperature() < -6) {
            game.increaseTemperature(player, 1);
        }
        AresTestHelper.addOcean(game, player);
        AresTestHelper.addOcean(game, player);

        var tiles = AresTestHelper.byTileType(AresTestHelper.getHazards(game));
        expect(tiles.get(TileType.EROSION_MILD)).has.lengthOf(0);
        expect(tiles.get(TileType.EROSION_SEVERE)).has.lengthOf(0);
        
        game.increaseTemperature(player, 1);

        expect(tiles.get(TileType.EROSION_MILD)).has.lengthOf(0);
        expect(tiles.get(TileType.EROSION_SEVERE)).has.lengthOf(0);

        AresTestHelper.addOcean(game, player);

        tiles = AresTestHelper.byTileType(AresTestHelper.getHazards(game));
        expect(tiles.get(TileType.EROSION_MILD)).has.lengthOf(0);
        expect(tiles.get(TileType.EROSION_SEVERE)).has.lengthOf(2);
    });
});