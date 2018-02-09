import { h, Component } from 'preact';
import VideoPlayer from '../../components/videoPlayer';
import MetaContainer from '../../components/metaContainer';
import PropTypes from 'prop-types';
import style from './style.scss';

export default class VideoContainer extends Component {
  propTypes = {
    activeVideoId: PropTypes.number
  };

  getVideoById(items, videoId) {
    var result;

    const checkMatch = item => {
      if (item.type === 'video' && item.meta && item.meta.id === videoId) {
        result = item;
        return true;
      }
      return Array.isArray(item.items) && item.items.some(checkMatch);
    };

    items.some(checkMatch);
    return result;
  }

  shouldComponentUpdate(nextProps) {
    return this.props.activeVideoId !== nextProps.activeVideoId;
  }

  render(props) {
    console.log('videoContainer props', props);

    const video =
      props.activeVideoId && props.activeVideoId.length > 0
        ? this.getVideoById(props.data, props.activeVideoId)
        : null;

    return (
      <div className={style.wrapper}>
        <VideoPlayer src={video ? video.src : null} />
        <MetaContainer meta={video ? video.meta : null} />
      </div>
    );
  }
}
