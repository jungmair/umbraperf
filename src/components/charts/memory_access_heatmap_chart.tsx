import * as model from '../../model';
import * as Controller from '../../controller/request_controller';
import * as Context from '../../app_context';
import Spinner from '../utils/spinner';
import React from 'react';
import { connect } from 'react-redux';
import { SignalListeners, Vega } from 'react-vega';
import { VisualizationSpec } from "react-vega/src";
import { Redirect } from 'react-router-dom';
import { createRef } from 'react';
import _, { reverse } from "lodash";
import { $CombinedState } from 'redux';


interface Props {
    appContext: Context.IAppContext;
    resultLoading: model.ResultLoading;
    csvParsingFinished: boolean;
    currentChart: string;
    currentEvent: string;
    events: Array<string> | undefined;
    chartIdCounter: number;
    chartData: model.ChartDataKeyValue,
    currentPipeline: Array<string> | "All";
    currentOperator: Array<string> | "All";
    operators: Array<string> | undefined;
    currentBucketSize: number,
    currentTimeBucketSelectionTuple: [number, number],
    currentView: model.ViewType;
    setCurrentChart: (newCurrentChart: string) => void;
    setChartIdCounter: (newChartIdCounter: number) => void;
    setCurrentEvent: (newCurrentEvent: string) => void;
}

interface State {
    chartId: number,
    width: number,
}

class MemoryAccessHeatmapChart extends React.Component<Props, State> {

    elementWrapper = createRef<HTMLDivElement>();

    constructor(props: Props) {
        super(props);
        this.state = {
            chartId: this.props.chartIdCounter,
            width: 0,
        };
        this.props.setChartIdCounter((this.state.chartId) + 1);

        this.createVisualizationSpecAbsolute = this.createVisualizationSpecAbsolute.bind(this);
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {

        if(this.props.resultLoading[this.state.chartId] !== nextProps.resultLoading[this.state.chartId]){
            return true;
        }
        if(!_.isEqual(this.props.resultLoading, nextProps.resultLoading)){
            return false;
        }
        return true;
    }

    componentDidUpdate(prevProps: Props): void {
        // this.setDefaultEventToMemLoads(this.props, prevProps);
        this.requestNewChartData(this.props, prevProps);
    }

    requestNewChartData(props: Props, prevProps: Props): void {
        if (this.newChartDataNeeded(props, prevProps)) {
            Controller.requestChartData(props.appContext.controller, this.state.chartId, model.ChartType.MEMORY_ACCESS_HEATMAP_CHART);
        }
    }

    newChartDataNeeded(props: Props, prevProps: Props): boolean {
        if (props.events &&
            props.operators &&
            (props.currentBucketSize !== prevProps.currentBucketSize ||
                props.currentView !== prevProps.currentView ||
                props.currentEvent !== prevProps.currentEvent ||
                !_.isEqual(props.operators, prevProps.operators) ||
                !_.isEqual(props.currentTimeBucketSelectionTuple, prevProps.currentTimeBucketSelectionTuple))) {
            return true;
        } else {
            return false;
        }
    }

    componentDidMount() {

        if (this.props.csvParsingFinished) {

            this.setState((state, props) => ({
                ...state,
                width: this.elementWrapper.current!.offsetWidth,
            }));

            this.props.setCurrentChart(model.ChartType.MEMORY_ACCESS_HEATMAP_CHART);

            addEventListener('resize', (event) => {
                this.resizeListener();
            });
        }
    }

    resizeListener() {
        if (!this.elementWrapper) return;

        const child = this.elementWrapper.current;
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
        if (this.props.resultLoading[this.state.chartId] || !this.props.chartData[this.state.chartId] || !this.props.operators) {
            return true;
        } else {
            return false;
        }
    }

    public render() {

        if (!this.props.csvParsingFinished) {
            return <Redirect to={"/upload"} />
        }

        return <div ref={this.elementWrapper} style={{ display: "flex", height: "100%", justifyContent: "center", alignItems: "center" }}>
            {this.isComponentLoading()
                ? <Spinner />
                : <div className={"vegaContainer"}>
                    {this.renderChartPerOperatorRelative()}
                    {/* {<Vega className={`vegaMemoryHeatmapAbsolute`} spec={this.createVisualizationSpecAbsolute()} />} */}
                </div>
            }
        </div>;
    }

    renderChartPerOperatorRelative() {
        const preparedData = this.flattenDataRelative();
        const domains = preparedData.domains;
        const dataFlattend = preparedData.dataFlattend;

        const dataFlattendFiltered = (curOp: string) => {
            const filteredData = dataFlattend.filter(elem => (elem.operator === curOp));
            return filteredData;
        }

        const specs = this.props.operators!.map((elem) => (this.createVisualizationSpecRelative(elem, domains, dataFlattendFiltered(elem))));
        const vegaElements: any = [];
        this.props.operators!.forEach((elem, index) => {
            if (specs[index]) {
                vegaElements.push(<Vega className={`vegaMemoryHeatmapRelative-${elem}`} key={index} spec={specs[index] as VisualizationSpec} />)
            }
        });

        return vegaElements;
    }

    flattenDataRelative() {
        const operatorArray = ((this.props.chartData[this.state.chartId] as model.ChartDataObject).chartData.data as model.IMemoryAccessHeatmapChart).operator;
        const bucketsArray = Array.from(((this.props.chartData[this.state.chartId] as model.ChartDataObject).chartData.data as model.IMemoryAccessHeatmapChart).buckets);
        const memoryAdressArray = Array.from(((this.props.chartData[this.state.chartId] as model.ChartDataObject).chartData.data as model.IMemoryAccessHeatmapChart).memoryAdress);
        const occurrencesArray = Array.from(((this.props.chartData[this.state.chartId] as model.ChartDataObject).chartData.data as model.IMemoryAccessHeatmapChart).occurrences);

        const dataFlattend: Array<{ operator: string, bucket: number, memAdr: number, occurrences: number }> = [];
        operatorArray.forEach((op, index) => {
            dataFlattend.push({
                operator: op,
                bucket: bucketsArray[index],
                memAdr: memoryAdressArray[index],
                occurrences: occurrencesArray[index],
            });
        }
        );


        const domains = {
            bucketDomain: [_.min(bucketsArray), _.max(bucketsArray)],
            memDomain: [_.min(memoryAdressArray), _.max(memoryAdressArray)],
            //occurrencesDomain: [0, Math.max(...occurrencesArray)],
        }

        return { dataFlattend, domains }
    }

    createVisualizationDataRelative(dataFlattendFiltered: any) {

        const data = [
            {
                name: "table",
                values: dataFlattendFiltered,
                transform: [
                    {
                        type: "extent",
                        field: "occurrences",
                        signal: "extent"
                    }
                ]
            },
            {
                name: "density",
                source: "table",
                transform: [
                    {
                        type: "kde2d",
                        size: [{ signal: "width" }, { signal: "height" }],
                        x: { "expr": "scale('x', datum.bucket)" },
                        y: { "expr": "scale('y', datum.memAdr)" },
                        bandwidth: { "signal": "[-1, -1]" },
                        as: "grid",
                    },
                    {
                        type: "heatmap",
                        field: "grid",
                        resolve: "shared",
                        //TODO times extend signal
                        color: { "expr": `scale('density', (datum.$value/datum.$max) * extent[1])` },
                        opacity: 1
                    }
                ]
            }
        ]
        return data;
    }

    createVisualizationSpecRelative(operator: string, domains: any, dataFlattendFiltered: Array<any>) {

        const visData = this.createVisualizationDataRelative(dataFlattendFiltered);

        if (visData[0].values && visData[0].values.length === 0) {
            return null;
        };

        const spec: VisualizationSpec = {
            $schema: "https://vega.github.io/schema/vega/v5.json",
            width: 300,
            height: 200,
            padding: { left: 5, right: 5, top: 10, bottom: 10 },
            autosize: { type: "pad", resize: false },


            title: {
                text: `Memory Access Heatmap: ${operator}`,
                align: model.chartConfiguration.titleAlign,
                dy: model.chartConfiguration.titlePadding,
                fontSize: model.chartConfiguration.titleFontSize,
                font: model.chartConfiguration.titleFont,
            },

            // data: visData,
            data: visData,

            "scales": [
                {
                    "name": "x",
                    "type": "linear",
                    domain: domains.bucketDomain,
                    domainMin: domains.bucketDomain[0],
                    domainMax: domains.bucketDomain[1],
                    "range": "width",
                    "zero": true,
                    "nice": true,
                    "round": true,
                },
                {
                    "name": "y",
                    "type": "linear",
                    domain: domains.memDomain,
                    domainMin: domains.memDomain[0],
                    domainMax: domains.memDomain[1],
                    "range": "height",
                    "zero": true,
                    "nice": true,
                    "round": true,
                },
                {
                    "name": "density",
                    "type": "linear",
                    "range": { "scheme": "Viridis" },
                    // "domain": [0, 1],
                    "domain": [0, { "signal": "extent[1]" }],
                    // "domain": [0, { signal: "extent" }],
                    "zero": true,
                }
            ],

            "axes": [
                {
                    "orient": "bottom",
                    "scale": "x",
                    labelOverlap: true,
                    title: model.chartConfiguration.memoryChartXTitle,
                    titlePadding: model.chartConfiguration.axisPadding,
                    labelFontSize: model.chartConfiguration.axisLabelFontSize,
                    titleFontSize: model.chartConfiguration.axisTitleFontSize,
                    titleFont: model.chartConfiguration.axisTitleFont,
                    labelFont: model.chartConfiguration.axisLabelFont,
                    labelSeparation: model.chartConfiguration.memoryChartXLabelSeparation,
                },
                {
                    orient: "left",
                    scale: "y",
                    zindex: 1,
                    title: model.chartConfiguration.memoryChartYTitle,
                    titlePadding: model.chartConfiguration.axisPadding,
                    labelFontSize: model.chartConfiguration.axisLabelFontSize,
                    labelSeparation: model.chartConfiguration.memoryChartYLabelSeparation,
                    labelOverlap: true,
                    titleFontSize: model.chartConfiguration.axisTitleFontSize,
                    titleFont: model.chartConfiguration.axisTitleFont,
                    labelFont: model.chartConfiguration.axisLabelFont,
                }
            ],

            "marks": [
                {
                    "type": "image",
                    "from": { "data": "density" },
                    "encode": {
                        "enter": {
                            // tooltip: {
                            //     signal: `{'Operator': '${operator}', ${model.chartConfiguration.memoryChartTooltip}}`,
                            // },
                        },
                        "update": {
                            "x": { "value": 0 },
                            "y": { "value": 0 },
                            "image": [
                                { "test": "extent[1] > 0", "field": "image" },
                            ],
                            "width": { "signal": "width" },
                            "height": { "signal": "height" },
                            "aspect": { "value": false },
                            "smooth": { "value": true }
                        }
                    }
                }
            ],

            "legends": [
                {
                    "fill": "density",
                    "type": "gradient",
                    "title": "Number of Accesses",
                    titleFontSize: model.chartConfiguration.legendTitleFontSize,
                    "titlePadding": 4,
                    "gradientLength": { "signal": "height - 20" },
                    "labelOpacity": [
                        { "test": "extent[1] > 0", "value": 1 },
                        { "value": 0 }
                    ]
                }
            ],
        } as VisualizationSpec;

        return spec;
    }


    createVisualizationDataAbsolute() {

        const operatorArray = ((this.props.chartData[this.state.chartId] as model.ChartDataObject).chartData.data as model.IMemoryAccessHeatmapChart).operator;
        const bucketsArray = Array.from(((this.props.chartData[this.state.chartId] as model.ChartDataObject).chartData.data as model.IMemoryAccessHeatmapChart).buckets);
        const memoryAdressArray = Array.from(((this.props.chartData[this.state.chartId] as model.ChartDataObject).chartData.data as model.IMemoryAccessHeatmapChart).memoryAdress);
        const occurrencesArray = Array.from(((this.props.chartData[this.state.chartId] as model.ChartDataObject).chartData.data as model.IMemoryAccessHeatmapChart).occurrences);

        const dataFlattend: Array<{ operator: string, bucket: number, memAdr: number }> = [];
        operatorArray.forEach((op, index) => {
            dataFlattend.push({
                operator: op,
                bucket: bucketsArray[index],
                memAdr: memoryAdressArray[index],
            });
        }
        );

        const domains = {
            bucketDomain: [_.min(bucketsArray), _.max(bucketsArray)],
            memDomain: [_.min(memoryAdressArray), _.max(memoryAdressArray)],
            occurrencesDomain: [_.min(occurrencesArray), _.max(occurrencesArray)],
        }

        const data = [
            {
                name: "table",
                values: dataFlattend,
            },
            {
                name: "density",
                source: "table",
                transform: [
                    {
                        type: "kde2d",
                        groupby: ["operator"],
                        size: [{ signal: "width" }, { signal: "height" }],
                        x: { "expr": "scale('x', datum.bucket)" },
                        y: { "expr": "scale('y', datum.memAdr)" },
                        bandwidth: { "signal": "[-1, -1]" },
                        as: "grid",
                    },
                    {
                        type: "heatmap",
                        field: "grid",
                        resolve: "shared",
                        color: { "expr": `scale('density', (datum.$value/datum.$max)*${domains.occurrencesDomain[1]})` },
                        opacity: 1
                    }
                ]
            }
        ]
        return { data, domains };
    }

    createVisualizationSpecAbsolute() {
        const visData = this.createVisualizationDataAbsolute();

        const getColumns = () => {
            if (this.state.width < 800) {
                return 1;
            } else if (this.state.width < 1200) {
                return 2;
            } else if (this.state.width < 1520) {
                return 3;
            } else {
                return 4;
            }
        }

        const spec: VisualizationSpec = {
            $schema: "https://vega.github.io/schema/vega/v5.json",
            width: 300,
            height: 200,
            padding: { left: 5, right: 5, top: 10, bottom: 10 },
            autosize: { type: "pad", resize: false },

            layout: {

                padding: 20,
                columns: getColumns(),
                align: "all",
                bounds: "full",
                center: { "row": true, "column": true },
            },

            title: {
                text: `Memory Access Heatmap (Absolute)`,
                align: model.chartConfiguration.titleAlign,
                dy: model.chartConfiguration.titlePadding,
                fontSize: model.chartConfiguration.titleFontSize,
                font: model.chartConfiguration.titleFont,
            },

            // data: visData,
            data: visData.data,

            "scales": [
                {
                    "name": "x",
                    "type": "linear",
                    "domain": visData.domains.bucketDomain,
                    domainMin: visData.domains.bucketDomain[0],
                    domainMax: visData.domains.bucketDomain[1],
                    "range": "width",
                    "zero": true,
                    "nice": true,
                    "round": true,
                },
                {
                    "name": "y",
                    "type": "linear",
                    "domain": visData.domains.memDomain,
                    domainMin: visData.domains.memDomain[0],
                    domainMax: visData.domains.memDomain[1],
                    "range": "height",
                    "zero": true,
                    "nice": true,
                    "round": true,
                },
                {
                    "name": "density",
                    "type": "linear",
                    "range": { "scheme": "Viridis" },
                    "domain": visData.domains.occurrencesDomain,
                    "zero": true,
                }
            ],

            "marks": [
                {
                    "type": "group",
                    "from": {
                        "facet": {
                            "name": "facet",
                            "data": "density",
                            "groupby": "operator"
                        }
                    },

                    //"sort": { "field": "datum.Origin", "order": "ascending" },

                    "title": {
                        "text": { "signal": "parent.operator" },
                        "frame": "group",
                        fontSize: model.chartConfiguration.titleFontSize,
                        font: model.chartConfiguration.titleFont,
                    },

                    "encode": {
                        "update": {
                            "width": { "signal": "width" },
                            "height": { "signal": "height" }
                        }
                    },

                    "axes": [
                        {
                            "orient": "bottom",
                            "scale": "x",
                            labelOverlap: true,
                            //values: xTicks(),
                            title: model.chartConfiguration.memoryChartXTitle,
                            titlePadding: model.chartConfiguration.axisPadding,
                            labelFontSize: model.chartConfiguration.axisLabelFontSize,
                            titleFontSize: model.chartConfiguration.axisTitleFontSize,
                            titleFont: model.chartConfiguration.axisTitleFont,
                            labelFont: model.chartConfiguration.axisLabelFont,
                            labelSeparation: model.chartConfiguration.memoryChartXLabelSeparation,
                        },
                        {
                            orient: "left",
                            scale: "y",
                            zindex: 1,
                            title: model.chartConfiguration.memoryChartYTitle,
                            titlePadding: model.chartConfiguration.axisPadding,
                            labelFontSize: model.chartConfiguration.axisLabelFontSize,
                            labelSeparation: model.chartConfiguration.memoryChartYLabelSeparation,
                            labelOverlap: true,
                            titleFontSize: model.chartConfiguration.axisTitleFontSize,
                            titleFont: model.chartConfiguration.axisTitleFont,
                            labelFont: model.chartConfiguration.axisLabelFont,
                        }
                    ],

                    "marks": [
                        {
                            "type": "image",
                            "from": { "data": "facet" },
                            "encode": {
                                "enter": {
                                    // tooltip: {
                                    //     signal: `{'Operator': '${operator}', ${model.chartConfiguration.memoryChartTooltip}}`,
                                    // },
                                },
                                "update": {
                                    "x": { "value": 0 },
                                    "y": { "value": 0 },
                                    "image": { "field": "image" },
                                    "width": { "signal": "width" },
                                    "height": { "signal": "height" },
                                    "aspect": { "value": false },
                                    "smooth": { "value": true }
                                }
                            }
                        }
                    ],
                    "legends": [
                        {
                            "fill": "density",
                            "type": "gradient",
                            "title": "# Accesses",
                            titleFontSize: model.chartConfiguration.legendTitleFontSize,
                            "titlePadding": 4,
                            "gradientLength": { "signal": "height - 20" },
                            direction: "vertical",
                            orient: "right",
                        }
                    ],
                }
            ],

        } as VisualizationSpec;

        return spec;
    }

}

const mapStateToProps = (state: model.AppState) => ({
    resultLoading: state.resultLoading,
    csvParsingFinished: state.csvParsingFinished,
    currentChart: state.currentChart,
    currentEvent: state.currentEvent,
    events: state.events,
    chartIdCounter: state.chartIdCounter,
    chartData: state.chartData,
    currentPipeline: state.currentPipeline,
    currentOperator: state.currentOperator,
    operators: state.operators,
    currentTimeBucketSelectionTuple: state.currentTimeBucketSelectionTuple,
    currentBucketSize: state.currentBucketSize,
    currentView: state.currentView,

});

const mapDispatchToProps = (dispatch: model.Dispatch) => ({
    setCurrentChart: (newCurrentChart: string) => dispatch({
        type: model.StateMutationType.SET_CURRENTCHART,
        data: newCurrentChart,
    }),
    setChartIdCounter: (newChartIdCounter: number) => dispatch({
        type: model.StateMutationType.SET_CHARTIDCOUNTER,
        data: newChartIdCounter,
    }),
    setCurrentEvent: (newCurrentEvent: string) => dispatch({
        type: model.StateMutationType.SET_CURRENTEVENT,
        data: newCurrentEvent,
    })
});


export default connect(mapStateToProps, mapDispatchToProps)(Context.withAppContext(MemoryAccessHeatmapChart));

