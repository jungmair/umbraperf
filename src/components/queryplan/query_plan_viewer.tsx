import * as model from '../../model';
import * as Controller from '../../controller';
import * as Context from '../../app_context';
import styles from '../../style/queryplan.module.css';
import Spinner from '../utils/spinner';
import React from 'react';
import { connect } from 'react-redux';
import { createRef } from 'react';
import _ from 'lodash';
import WarningIcon from '@material-ui/icons/Warning';
import Typography from '@material-ui/core/Typography';
import DagreGraph from 'dagre-d3-react';


interface Props {
    appContext: Context.IAppContext;
    csvParsingFinished: boolean;
    queryPlan: object | undefined;
    currentView: model.ViewType;
    currentOperator: Array<string> | "All";
    setCurrentChart: (newCurrentChart: string) => void;
}

interface State {
    height: number,
    width: number,
    loading: boolean,
    renderedDagrePlan: JSX.Element | undefined,
}

interface GraphProps {
    nodes: DagreNode[];
    links: DagreEdge[];
    zoomable?: boolean;
    fitBoundaries?: boolean;
    height?: string;
    width?: string;
    config?: 'html' | 'svg' | 'string';
    animate?: number;
    className?: string;
    shape?: 'rect' | 'circle' | 'ellipse';
    onNodeClick?: Function;
    onRelationshipClick?: Function;
}

type DagreNode = {
    label: string
    id: string,
    parent: string,
    class: string
}

type DagreEdge = {
    source: string,
    target: string,
    class: string,
    config: object
}


class QueryPlanViewer extends React.Component<Props, State> {

    graphContainer = createRef<HTMLDivElement>();


    constructor(props: Props) {
        super(props);
        this.state = {
            height: 0,
            width: 0,
            loading: true,
            renderedDagrePlan: undefined,
        };

    }

    componentDidUpdate(prevProps: Props, prevState: State): void {
        if (this.state.width !== prevState.width ||
            this.props.queryPlan !== prevProps.queryPlan ||
            this.props.currentView !== prevProps.currentView ||
            !_.isEqual(this.props.currentOperator, prevProps.currentOperator)) {
            this.setState((state, props) => ({
                ...state,
                renderedDagrePlan: undefined,
            }));
            console.log(this.state)
            this.createQueryPlan();
        }
    }


    componentDidMount() {

        this.setState((state, props) => ({
            ...state,
            width: this.graphContainer.current!.offsetWidth,
            height: this.graphContainer.current!.offsetHeight,
        }));

        if (this.props.csvParsingFinished) {
            this.props.setCurrentChart(model.ChartType.QUERY_PLAN);

            addEventListener('resize', (event) => {
                this.resizeListener();
            });
        }
    }

    resizeListener() {
        if (!this.graphContainer) return;

        const child = this.graphContainer.current;
        if (child) {
            const newWidth = child.offsetWidth;

            child.style.display = 'none';

            this.setState((state, props) => ({
                ...state,
                width: newWidth,
            }));

            child.style.display = 'block';
        }

    }

    isComponentLoading(): boolean {
        if (!this.props.queryPlan) {
            return true;
        } else {
            return false;
        }
    }

    public render() {

        return <div ref={this.graphContainer} className={styles.elementWrapper}>
            {this.isComponentLoading()
                ? <Spinner />
                : <div className={styles.queryplanContainer}>
                    {this.state.renderedDagrePlan}
                </div>
            }
        </div>;
    }

    createQueryPlan() {
        const queryPlanJson = this.props.queryPlan;
        let queryplanContent: JSX.Element;

        if (undefined === queryPlanJson || queryPlanJson.hasOwnProperty('error')) {
            queryplanContent = this.createNoQueryPlanWarning();
        } else {
            queryplanContent = this.createDagrePlan(queryPlanJson);
        }
        this.setState((state, props) => ({
            ...state,
            loading: false,
            renderedDagrePlan: queryplanContent,
        }));
    }

    createDagrePlan(queryplanJson: object) {

        const rootNode = {
            label: "RESULT",
            id: "root",
            child: queryplanJson,
        }
        const dagreData = this.createDagreNodesLinks(rootNode);

        return <DagreGraph
            className={styles.dagreGraph}
            nodes={dagreData.nodes}
            links={dagreData.links}
            config={{
                rankdir: 'LR',
                ranker: 'network-simplex',
                height: "100px",
                width: "500px",
            }}
            animate={500}
            shape='circle'
            fitBoundaries={false}
            // zoomable={true}
            onNodeClick={(event: { d3norde: object, original: DagreNode }) => this.handleNodeClick(event)}
        // onRelationshipClick={e => console.log(e)}
        />
    }

    handleNodeClick(event: { d3norde: object, original: DagreNode }) {
        //TODO add pipeline, make pipeline in function in controller obliq
        Controller.handleOperatorSelection(event.original.id);

    }

    createDagreNodesLinks(root: Partial<DagreNode> & { child: object }) {


        let dagreData = {
            nodes: new Array<DagreNode>(),
            links: new Array<DagreEdge>()
        }

        const nodeClass = (nodeId: string) => {
            if (this.props.currentOperator === "All" || this.props.currentOperator.includes(nodeId)) {
                return styles.dagreActiveNode;
            } else {
                return styles.dagreInactiveNode;
            }
        }

        dagreData.nodes.push({ label: root.label!, id: root.id!, parent: "", class: styles.dagreRootNode })
        fillGraph(root.child, root.id!)

        function fillGraph(currentPlanElement: any, parent: string) {

            dagreData.nodes.push({ label: currentPlanElement.operator, id: currentPlanElement.operator, parent: parent, class: nodeClass(currentPlanElement.operator) });
            dagreData.links.push({ source: parent, target: currentPlanElement.operator, class: styles.dagreEdge, config: { arrowheadStyle: 'display: none' } });

            ["input", "left", "right"].forEach(childType => {
                if (currentPlanElement.hasOwnProperty(childType)) {
                    fillGraph(currentPlanElement[childType], currentPlanElement.operator);
                }
            });
        }

        return dagreData;

    }

    createNoQueryPlanWarning() {
        return <div className={styles.warningContainer}>
            <WarningIcon
                fontSize="large"
                color="secondary"
            />
            <Typography
                style={{ color: this.props.appContext.tertiaryColor }}
                variant="caption"
            >
                A Problem occured reading the query plan.
            </Typography>
        </div>
    }
}


const mapStateToProps = (state: model.AppState) => ({
    csvParsingFinished: state.csvParsingFinished,
    queryPlan: state.queryPlan,
    currentView: state.currentView,
    currentOperator: state.currentOperator,
});

const mapDispatchToProps = (dispatch: model.Dispatch) => ({
    setCurrentChart: (newCurrentChart: string) => dispatch({
        type: model.StateMutationType.SET_CURRENTCHART,
        data: newCurrentChart,
    }),
});


export default connect(mapStateToProps, mapDispatchToProps)(Context.withAppContext(QueryPlanViewer));
