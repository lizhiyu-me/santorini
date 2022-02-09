import { SocketIO } from 'boardgame.io/multiplayer';
import { Client } from 'boardgame.io/react';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Tippy from '@tippyjs/react';
import { LobbyAPI } from 'boardgame.io';
import { isProduction } from '../../config';
import { SERVER_URL } from '../../config/client';
import { SantoriniGame } from '../../game';
import { useStoreActions, useStoreState } from '../../store';
import { GameBoard } from '../GameBoard';
import { ButtonBack } from '../ButtonBack';
import { LobbyPage } from './Wrapper';
import { Button } from '../Button';
import { getMatch } from '../../api';
import { isMobile, supportsCopying, copyToClipboard } from '../../util';
import 'tippy.js/dist/tippy.css';
import './Game.scss';

const GameClient = Client({
  game: SantoriniGame,
  board: GameBoard,
  multiplayer: SocketIO({ server: SERVER_URL }),
  debug: !isProduction && !isMobile(),
});

export const GameLobbySetup = ({ startGame } : { startGame(): void }) : JSX.Element => {
  const { matchID } = useParams<{ matchID: string }>();
  const [matchMetadata, setMatchMetadata] = useState<LobbyAPI.Match | null>(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const nickname = useStoreState((s) => s.nickname);
  const activeRoomPlayer = useStoreState((s) => s.activeRoomPlayer);
  const joinRoom = useStoreActions((s) => s.joinRoom);

  const gameRoomFull = matchMetadata?.players.filter((p) => !p.name).length === 0;

  // poll api to load match data
  useEffect(() => {
    function pollMatch() {
      if (matchID) {
        getMatch(matchID).then((m) => {
          if (m) {
            setMatchMetadata(m);
          }
        });
      }
    }

    pollMatch();
    const intervalID = setInterval(() => {
      pollMatch();
    }, 500);

    return () => clearInterval(intervalID);
  }, [matchID]);

  // if game room is full, start the game
  useEffect(() => {
    if (gameRoomFull) {
      setTimeout(() => startGame(), 2000);
    }
  }, [gameRoomFull, startGame]);

  useEffect(() => {
    // find first empty seat ID
    const emptySeatID = matchMetadata?.players.find((p) => !p.name)?.id;
    const alreadyJoined = activeRoomPlayer && activeRoomPlayer.matchID === matchID;

    if (!alreadyJoined && emptySeatID !== undefined && nickname && matchID) {
      joinRoom({ playerID: emptySeatID.toString(), playerName: nickname, matchID });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchMetadata]);

  return (
    <LobbyPage>
      <ButtonBack to="/" />

      <div className="lobby__title">{matchMetadata?.unlisted ? 'Private Game' : 'Public Game'}</div>
      <div className="lobby__subtitle">
        Send a link to someone to invite them to your game.
        <br />
        Copy in another browser to play locally. (ie Chrome and Edge)
      </div>
      <div className="lobby__link">
        <div className="lobby__link-box">{window.location.href}</div>

        {supportsCopying && (
          <Tippy
            visible={tooltipVisible}
            offset={[0, 12]}
            content={<p>Copied!</p>}
          >
            <div className="lobby__link-buttons">
              <Button
                theme="blue"
                onClick={() => {
                  copyToClipboard(window.location.href);
                  setTooltipVisible(true);
                  setTimeout(() => setTooltipVisible(false), 1500);
                }}
              >
                Copy
              </Button>
            </div>
          </Tippy>
        )}

      </div>

      <div className="lobby__players">
        {matchMetadata ? (
          matchMetadata.players?.map((player) => (player.name ? (
            <div
              key={player.id}
              className="lobby__player lobby__player--active"
            >
              {`${player.name} ${
                activeRoomPlayer
                && activeRoomPlayer.matchID === matchID
                && activeRoomPlayer.playerID === player.id.toString()
                  ? '(You)'
                  : ''
              }`}
            </div>
          ) : (
            <div
              key={player.id}
              className="lobby__player lobby__player--inactive"
            >
              Waiting for player...
            </div>
          )))
        ) : (
          <p>Loading...</p>
        )}
      </div>

      <div className="lobby__status-message">
        {gameRoomFull ? (
          <p>Starting Game...</p>
        ) : (
          <p>Game will start when both players join</p>
        )}
      </div>
    </LobbyPage>
  );
};

export const GameLobbyPlay = () : JSX.Element => {
  const { matchID } = useParams<{ matchID: string }>();
  const activeRoomPlayer = useStoreState((s) => s.activeRoomPlayer);

  // Join as a player if the active room player data is set for this match id
  if (matchID && activeRoomPlayer?.matchID === matchID) {
    return (
      <GameClient
        matchID={matchID}
        playerID={String(activeRoomPlayer?.playerID)}
        credentials={activeRoomPlayer?.credential}
      />
    );
  }

  // Join as a spectator
  return (
    <GameClient matchID={matchID} />
  );
};

export const GameLobby = () : JSX.Element => {
  const [isGameRunning, setGameRunning] = useState(false);

  return isGameRunning ? (
    <GameLobbyPlay />
  ) : (
    <GameLobbySetup startGame={() => setGameRunning(true)} />
  );
};