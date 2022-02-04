import { getAdjacentPositions } from '../utility';
import { Mortal } from './Mortal';
import { Character } from '../../types/CharacterTypes';

export const Ares: Character = {
  ...Mortal,
  desc: `End of Your Turn: You may remove an unoccupied block (not dome) neighboring your
    unmoved Worker. You also remove any Tokens on the block.`,
  buttonText: 'Skip Remove',

  buttonPressed: (context, charState) => {
    charState.buttonActive = false;
    return 'end';
  },

  getStageAfterBuild: (context, charState) => {
    if (Ares.validSpecial(context, charState, -1).size > 0) {
      charState.buttonActive = true;
      return 'special';
    }

    return 'end';
  },

  validSpecial: ({ G }, charState, fromPos) => {
    const valids = new Set<number>();

    if (charState.workers.length < 2) {
      return valids;
    }
    fromPos = charState.workers[(charState.selectedWorkerNum + 1) % 2].pos;
    getAdjacentPositions(fromPos).forEach((pos) => {
      if (!G.spaces[pos].inhabitant && !G.spaces[pos].isDomed && G.spaces[pos].height > 0) {
        valids.add(pos);
      }
    });
    return valids;
  },

  special: ({ G }, charState, pos) => {
    G.spaces[pos].height -= 1;
    charState.buttonActive = false;
    // TODO: tokens
  },

};