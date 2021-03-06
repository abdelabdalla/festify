import '@polymer/paper-fab/paper-fab';
import '@polymer/paper-icon-button/paper-icon-button';
import { connect, withProps } from 'fit-html';
import { html } from 'lit-html/lib/lit-extended';
import { createSelector } from 'reselect';

import { installPlaybackMaster } from '../actions/party-data';
import { togglePlaybackStart } from '../actions/playback-spotify';
import { removeTrackAction, setVoteAction } from '../actions/queue';
import srcsetImg from '../components/srcset-img';
import { isPartyOwnerSelector, isPlaybackMasterSelector, playbackMasterSelector } from '../selectors/party';
import {
    artistJoinerFactory,
    queueTracksSelector,
    singleMetadataSelector,
    singleTrackSelector,
    tracksEqual,
    voteStringGeneratorFactory,
} from '../selectors/track';
import { Metadata, State, Track, TrackReference } from '../state';
import sharedStyles from '../util/shared-styles';

export interface PartyTrackProps {
    artistName: string | null;
    disablePlayButton: boolean;
    hasVoted: boolean;
    isOwner: boolean;
    isMusicPlaying: boolean;
    isPlayingTrack: boolean;
    metadata: Metadata | null;
    showRemoveButton: boolean;
    showTakeoverButton: boolean;
    togglingPlayback: boolean;
    track: Track | null;
    voteString: string;
}

interface PartyTrackDispatch {
    removeTrack: (ref: TrackReference) => void;
    takeOverPlayback: () => void;
    togglePlayPause: () => void;
    setVote: (ref: TrackReference, vote: boolean) => void;
}

interface PartyTrackOwnProps {
    playing: boolean;
    trackid: string;
}

/* tslint:disable:max-line-length */
const LikeButtonIcon = (props: PartyTrackProps): string => {
    if (!props.track) {
        return '';
    }

    if (props.hasVoted) {
        return 'festify:favorite';
    } else if (props.track.vote_count > 0 || props.track.is_fallback) {
        return 'festify:favorite-border';
    } else {
        return 'festify:add';
    }
};

const PlayButton = (props: PartyTrackProps & PartyTrackDispatch) => {
    if (props.isPlayingTrack) {
        return html`
            ${props.isOwner && props.track
                ? html`
                    <paper-icon-button icon="festify:skip-next"
                                       on-click="${() => props.removeTrack(props.track!.reference)}"
                                       title="Skip ${props.metadata ? props.metadata.name : 'Loading...'}">
                    </paper-icon-button>
                `
                : null}
            <div class="fab-spinner">
                <paper-spinner-lite active="${props.togglingPlayback}"></paper-spinner-lite>
                <paper-fab mini
                           icon="${props.isMusicPlaying ? 'festify:pause' : 'festify:play-arrow'}"
                           on-click="${props.togglePlayPause}"
                           disabled="${props.disablePlayButton}">
                </paper-fab>
            </div>
        `;
    } else {
        return props.track
            ? html`
                <paper-icon-button icon="${LikeButtonIcon(props)}"
                                   on-click="${() => props.setVote(props.track!.reference, !props.hasVoted)}"
                                   title="${(props.hasVoted ? "Unvote " : "Vote for ") + (props.metadata ? props.metadata.name : 'Loading...')}">
                </paper-icon-button>
            `
            : null;
    }
};

export const PartyTrack = (props: PartyTrackProps & PartyTrackDispatch) => html`
    ${sharedStyles}
    <style>
        :host {
            box-sizing: content-box;
            padding: 5px 16px;
            display: flex;
            align-items: center;
            flex-direction: row;
        }

        :host([playing]) {
            background-color: #22262b;
            padding: 13px 16px;
        }

        :host([playing]) + :host {
            padding-top: 13px;
        }

        :host([playing]) img {
            box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.5);
        }

        :host([playing]) .metadata-wrapper {
            margin-right: 20px;
        }

        img, .empty {
            background: rgba(0, 0, 0, 0.2);
            flex-shrink: 0;
            height: 54px;
            margin-right: 15px;
            width: 54px;
        }

        .metadata-wrapper {
            margin-top: 2px;
            overflow: hidden;
        }

        h2 {
            margin: 0;
            font-weight: lighter;
            font-size: 15px;
            line-height: 20px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        aside {
            margin: 2px 0;
            font-weight: 300;
            font-size: 13px;
            line-height: 20px;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
        }

        .dot {
            margin: 0 4px;
        }

        .icon-wrapper {
            display: flex;
            margin-left: auto;
            flex-basis: 40px;
        }

        paper-fab {
            color: white;
            background-color: var(--primary-color);
        }

        paper-icon-button {
            margin-left: 5px;
            padding: 6px;
        }

        .fab-spinner {
            margin-left: 5px;
            position: relative;
        }

        .fab-spinner paper-spinner-lite {
            --paper-spinner-stroke-width: 2px;
            --offset: calc(-1 * var(--paper-spinner-stroke-width));
            --size: calc(40px + 2 * var(--paper-spinner-stroke-width));

            position: absolute;
            top: var(--offset);
            left: var(--offset);
            width: var(--size);
            height: var(--size);
            --paper-spinner-color: white;
            pointer-events: none;
        }
    </style>

    ${props.metadata
        ? srcsetImg(props.metadata.cover, '54px')
        : html`<div class="empty"></div>`}
    <div class="metadata-wrapper">
        <h2>${props.metadata ? props.metadata.name : 'Loading...'}</h2>
        ${props.artistName
            ? html`
                <aside>
                    <a>${props.artistName}</a>
                    <span class="dot">&middot;</span>
                    <span>${props.voteString}</span>
                </aside>
            `
            : null
        }
    </div>

    <div class="icon-wrapper">
        ${props.showTakeoverButton
            ? html`
                <paper-icon-button icon="festify:download"
                                   on-click="${props.takeOverPlayback}"
                                   title="Transfer playback to current device">
                </paper-icon-button>
            `
            : null}
        ${props.showRemoveButton
            ? html`
                <paper-icon-button icon="festify:clear"
                                   on-click="${() => props.removeTrack(props.track!.reference)}"
                                   title="Remove ${props.metadata ? props.metadata.name : 'Loading...'} from queue">
                </paper-icon-button>
            `
            : null}
        ${PlayButton(props)}
    </div>
`;
/* tslint:enable */

const isCompatibleSelector = (s: State) => s.player.isCompatible;
const disablePlayButtonSelector = createSelector(
    isPartyOwnerSelector,
    (s: State) => s.player.togglingPlayback,
    isCompatibleSelector,
    playbackMasterSelector,
    (isOwner, isToggling, isCompatible, playbackMaster) =>
        Boolean(!isOwner || isToggling || (!isCompatible && !playbackMaster)),
);

export const createMapStateToPropsFactory = (
    trackSelector: (state: State, trackId: string) => Track | null,
) => {
    const isPlayingSelector = createSelector(
        queueTracksSelector,
        trackSelector,
        (tracks, track) => tracksEqual(tracks[0], track),
    );
    const hasVotesOrIsFallbackSelector = createSelector(
        trackSelector,
        track => Boolean(track && (track.vote_count > 0 || track.is_fallback)),
    );

    /*
     * Since the selectors use component props, one for each instance must be created.
     */
    return () => {
        const artistJoiner = artistJoinerFactory();
        const showRemoveTrackButtonSelector = createSelector(
            isPartyOwnerSelector,
            hasVotesOrIsFallbackSelector,
            isPlayingSelector,
            (isOwner, hasVotesOrIsFallback, isPlaying) => isOwner && hasVotesOrIsFallback && !isPlaying,
        );
        const showTakeoverButtonSelector = createSelector(
            isPartyOwnerSelector,
            isPlaybackMasterSelector,
            playbackMasterSelector,
            isPlayingSelector,
            isCompatibleSelector,
            (isOwner, isMaster, master, isPlaying, isCompatible) =>
                isPlaying && isOwner && !isMaster && !!master && isCompatible,
        );
        const voteStringGenerator = voteStringGeneratorFactory(trackSelector);

        return (state: State, ownProps: PartyTrackOwnProps): PartyTrackProps => ({
            artistName: artistJoiner(state, ownProps.trackid),
            disablePlayButton: disablePlayButtonSelector(state),
            hasVoted: !!state.party.userVotes && state.party.userVotes[ownProps.trackid] === true,
            isOwner: isPartyOwnerSelector(state),
            isMusicPlaying: !!state.party.currentParty && state.party.currentParty.playback.playing,
            isPlayingTrack: ownProps.playing,
            metadata: singleMetadataSelector(state, ownProps.trackid),
            showRemoveButton: showRemoveTrackButtonSelector(state, ownProps.trackid),
            showTakeoverButton: showTakeoverButtonSelector(state, ownProps.trackid),
            togglingPlayback: state.player.togglingPlayback,
            track: trackSelector(state, ownProps.trackid),
            voteString: voteStringGenerator(state, ownProps.trackid),
        });
    };
};

export const mapDispatchToProps: PartyTrackDispatch = {
    removeTrack: (ref: TrackReference) => removeTrackAction(ref, false),
    setVote: setVoteAction,
    takeOverPlayback: installPlaybackMaster,
    togglePlayPause: togglePlaybackStart,
};

const PartyTrackBase = withProps(connect(
    createMapStateToPropsFactory(singleTrackSelector),
    mapDispatchToProps,
    PartyTrack,
), {
    playing: Boolean,
    trackid: String,
});

customElements.define(
    'party-track',
    PartyTrackBase,
);
