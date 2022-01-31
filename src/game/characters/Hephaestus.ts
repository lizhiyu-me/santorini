import { Character, CharacterState } from '../../types/CharacterTypes';
import { Mortal } from './Mortal';
import { getAdjacentPositions } from '../utility';
import { Board } from '../space';

interface HephaestusAttrs {
  numBuilds: number,
  firstBuildPos: number,
}

export const Hephaestus: Character<HephaestusAttrs> = {
  ...Mortal,
  desc: 'Your Build: Your Worker may build one additional block (not dome) on top of your first block.',
  buttonText: 'Skip 2nd Build',
  attrs: {
    numBuilds: 0,
    firstBuildPos: -1,
  },

  buttonPressed: (context, char: CharacterState<HephaestusAttrs>) => {
    // reset stuff
    char.attrs.numBuilds = 0;
    char.buttonActive = false;

    // set game stage
    return 'end';
  },

  validBuild: ({ G }, char: CharacterState<HephaestusAttrs>, originalPos) => {
    const adjacents: number[] = getAdjacentPositions(originalPos);
    const valids: number[] = [];

    if (char.attrs.numBuilds === 0) {
      adjacents.forEach((pos) => {
        if (!G.spaces[pos].inhabitant && !G.spaces[pos].isDomed) {
          valids.push(pos);
        }
      });
    } else {
      valids.push(char.attrs.firstBuildPos);
    }

    return valids;
  },

  build: ({ G }, char: CharacterState<HephaestusAttrs>, pos) => {
    char.attrs.numBuilds += 1;

    if (char.attrs.numBuilds === 1) {
      Board.build(G, pos);

      if (G.spaces[pos].height > 2) {
        char.attrs.numBuilds = 0;
        return 'end';
      }

      char.attrs.firstBuildPos = pos;
      char.buttonActive = true;
      return 'build';
    }

    char.attrs.numBuilds = 0;
    char.buttonActive = false;
    Board.build(G, pos);
    return 'end';
  },
};
