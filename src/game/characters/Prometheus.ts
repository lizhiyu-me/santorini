import { Ctx } from "boardgame.io";
import { get_adjacent_positions } from '../utility'
import { Mortal, Character } from '../character'
import { GameState, Player } from '../index'
import { Board } from '../space'

export class Prometheus extends Mortal {
  
  public static desc = `Your Turn: If your Worker does not move up, it may build both before and after moving.`;
  public static buttonText = 'Bulid Before Move'
  // public static buttonActive = true;

  public static attributes = {
      specialActive: false,
      specialUsed: false,
      originalPos: -1,
  };

  public static onTurnBegin(
    G: GameState, 
    ctx: Ctx,
    player: Player, 
    char: Character
  ) : void {
    char.buttonActive = true;
  }

  public static select(
    G: GameState, 
    ctx: Ctx,
    player: Player, 
    char: Character,
    pos: number
  ) : string {
    char.selectedWorker = G.spaces[pos].inhabitant.workerNum;
    if (char.attributes.specialActive)
      return 'build';
    else
      return 'move';
  }

  public static valid_move(
    G: GameState,
    ctx: Ctx,
    player: Player,
    char: Character,
    originalPos: number
  ) : number[] {
        
    let height = (char.attributes.specialUsed ? 0 : char.moveUpHeight)
    if (char.attributes.specialUsed) {
      originalPos = char.attributes.originalPos;
    }

    let adjacents : number[] = get_adjacent_positions(originalPos);
    let valids : number[] = []

    adjacents.forEach( pos => {
      if (!G.spaces[pos].inhabited &&
        !G.spaces[pos].is_domed &&
        G.spaces[pos].height - G.spaces[originalPos].height <= height
        )
      {
        valids.push(pos);
      }
    })
  
    return valids;
  }

  public static move (
    G: GameState, 
    ctx: Ctx,
    player: Player,
    char: Character, 
    pos: number
  ) : string {

      char.buttonActive = false;
  
      // free the space that is being moved from
      Board.free(G, char.workers[char.selectedWorker].pos);

      // place the worker on the selected space
      Board.place(G, pos, player.id, char.selectedWorker);

      return 'build';
  }

  public static build (
    G: GameState,
    ctx: Ctx,
    player: Player, 
    char: Character,
    pos: number
  ) : string {
    Board.build(G, pos);

    if (char.attributes.specialActive) {
      char.attributes.specialUsed = true;
      char.attributes.originalPos = char.workers[char.selectedWorker].pos;

      char.buttonActive = false;
      char.attributes.specialActive = false;
      char.buttonText = 'Build Before Move';

      return 'move';
    }
    else {
      char.attributes.specialUsed = false;
      char.attributes.originalPos = -1;
      return 'end';
    }
  }

  public static buttonPressed(
    G: GameState, 
    ctx: Ctx,
    player: Player,
    char: Character
  ) : void {
    char.attributes.specialActive = !char.attributes.specialActive;

    if (char.attributes.specialActive) {
      char.buttonText = 'Cancel';
      if (G.stage === 'move')
        G.stage = 'build';
    }
    else {
      char.buttonText = 'Build Before Move';
      if (G.stage === 'build')
        G.stage = 'move';
    }
  }
}