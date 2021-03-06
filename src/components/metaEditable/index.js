import { h, Component } from 'preact';
import style from './style.scss';
import metaStyle from '../meta/style.scss';
import PropTypes from 'prop-types';
import Octicon from '../../components/octicon';
import { route } from 'preact-router';
import TagsEditable from '../tagsEditable';
import InlineEditor from '../inlineEditor';
import { connect } from 'unistore/preact';
import actions from './actions';
import crawl from 'tree-crawl';
import speakingurl from 'speakingurl';

export class MetaEditable extends Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      peopleSuggestions: [],
      tagsSuggestions: [],
      meta: { ...props.video.meta }
    };
  }

  propTypes = {
    video: PropTypes.object,
    data: PropTypes.object,
    onSave: PropTypes.func,
    handleSave: PropTypes.func,
    onMount: PropTypes.func,
    getLatestMeta: PropTypes.func
  };

  getListOfArrayKey(tree, key) {
    let result = [];

    crawl(
      tree,
      node => {
        if (node.meta && node.meta[key]) {
          // check if it's a comma separated string instead of an array, and split it up
          const arr =
            node.meta[key][0] && node.meta[key][0].indexOf(',') > -1
              ? node.meta[key][0].split(',')
              : node.meta[key];

          result = this.mergeArray([result, arr]);
        }
      },
      { getChildren: node => node.items }
    );

    return this.uniqueArray(result);
  }

  mergeArray(arr) {
    return [].concat(...arr);
    //return Array.from(new Set([].concat(...arr))); // merge & unique
  }

  uniqueArray(a) {
    return Array.from(new Set(a));
  }

  componentDidMount() {
    if (typeof this.props.onMount === 'function') {
      this.props.onMount();
    }

    // make sure to get the latest state from server, in case someone
    // else edited this video before and client state is out of date
    this.props.getLatestMeta();
  }

  componentWillMount() {
    // TODO call this on componentWillReceiveProps?
    // TODO combine these two iterations, so both keys will be returned without iterating twice
    const peopleSuggestions = this.getListOfArrayKey(this.props.data, 'people');
    const tagsSuggestions = this.getListOfArrayKey(this.props.data, 'tags');
    this.setState({ peopleSuggestions, tagsSuggestions });
  }

  componentWillReceiveProps(nextProps) {
    // We need watch for changes in props.video.meta manually,
    // as we copy props.video.meta to the state
    // This is actually an anti-pattern, but still valid in our "editing" use-case
    if (nextProps.video.meta !== this.props.video.meta) {
      this.setState({ meta: nextProps.video.meta });
    }
  }

  handleTitleChange = title => {
    this.setState(prevState => {
      const meta = prevState.meta;
      meta.title = title;
      return { meta };
    });
  };

  handlePeopleChange = people => {
    this.setState(prevState => {
      const meta = prevState.meta;
      meta.people = people;
      return { meta };
    });
  };

  handleTagsChange = tags => {
    this.setState(prevState => {
      const meta = prevState.meta;
      meta.tags = tags;
      return { meta };
    });
  };

  handleDescriptionChange = description => {
    this.setState(prevState => {
      const meta = prevState.meta;
      meta.description = description;
      return { meta };
    });
  };

  handleSubmit = event => {
    if (event) {
      event.preventDefault();
    }

    this.setState(
      prevState => {
        const meta = prevState.meta;
        meta.slug = speakingurl(prevState.meta.title);
        return { meta };
      },
      () => {
        this.props.handleSave(this.state.meta, this.props.video.src);

        // end edit mode
        route(`/${this.state.meta.id}/${this.state.meta.slug}`);
      }
    );
  };

  handleCancel = event => {
    if (event) {
      event.preventDefault();
    }
    route('.');
  };

  handleKeyDown = event => {
    // ctrl-enter or cmd-enter (MacOS) submit
    if (
      (event.ctrlKey || event.metaKey) &&
      (event.keyCode === 13 || event.keyCode === 10)
    ) {
      this.handleSubmit();
    }

    // cancel on escape
    if (event.keyCode === 27) {
      this.handleCancel();
    }
  };

  render(props, state) {
    const { video } = props;
    return (
      <div className={metaStyle.meta}>
        <div className={metaStyle.path}>
          {video.path &&
            video.path.map((folder, j) => (
              <span key={`folder${j}`}>
                {folder}
                {video.path.length === j + 1 ? '' : ' / '}
              </span>
            ))}
        </div>
        <form
          onSubmit={this.handleSubmit}
          className={style.form}
          onKeyDown={this.handleKeyDown}
        >
          <h1>
            <InlineEditor
              value={state.meta.title}
              placeholder="Enter title..."
              onChange={this.handleTitleChange}
              minlength="3"
              maxlength="150"
              required
            />
          </h1>
          <div className={metaStyle.people}>
            <Octicon name="person" className={metaStyle.icon} />
            <TagsEditable
              tags={state.meta.people}
              suggestions={state.peopleSuggestions}
              placeholder="Add person"
              onChange={this.handlePeopleChange}
              classNames={{
                selectedTagName: metaStyle.person
              }}
            />
          </div>
          <div className={metaStyle.tags}>
            <TagsEditable
              tags={state.meta.tags}
              suggestions={state.tagsSuggestions}
              placeholder="Add tag"
              onChange={this.handleTagsChange}
              classNames={{
                selectedTag: metaStyle.tag
              }}
            />
          </div>
          <div className={metaStyle.description}>
            <InlineEditor
              value={state.meta.description}
              placeholder="Enter description..."
              onChange={this.handleDescriptionChange}
              maxlength="1500"
            />
          </div>
          <div className={style.buttonContainer}>
            <button onClick={this.handleCancel}>Cancel</button>
            <button type="submit" className={style.saveButton + ' primary'}>
              Save
            </button>
          </div>
        </form>
      </div>
    );
  }
}

const mapStateToProps = ({ data }) => ({ data });

export default connect(mapStateToProps, actions)(MetaEditable);
