import * as model from '../../model';
import React from 'react';
import { connect } from 'react-redux';
import { IAppContext, withAppContext } from '../../app_context';
import { Vega } from 'react-vega';
import { Result } from 'src/model/core_result';
import { VisualizationSpec } from "../../../node_modules/react-vega/src";
import styles from '../../style/charts.module.css';
import { Redirect } from 'react-router-dom';
import { createRef } from 'react';
import { ChartType, requestChartData } from '../../controller/web_file_controller';
import { CircularProgress } from '@material-ui/core';
import InterpolationDropdown from '../utils/interpolation_dropdown';
import EventsButtons from '../utils/events_buttons';
import * as RestApi from '../../model/rest_queries';
import BucketsizeDropdwn from '../utils/bucketsize_dropdown';


interface Props {
   appContext: IAppContext;
   resultLoading: boolean;
   result: Result | undefined;
   csvParsingFinished: boolean;
   currentChart: string;
   currentEvent: string;
   currentRequest: RestApi.RestQueryType | undefined;
   events: Array<string> | undefined;
   chartIdCounter: number;
   chartData: model.ChartDataKeyValue,
   setCurrentChart: (newCurrentChart: string) => void;
   setChartIdCounter: (newChartIdCounter: number) => void;

}

interface State {
   chartId: number,
   chartData: IChartData | undefined,
   width: number,
   height: number,
   interpolation: string;
   bucketsize: number;
}

interface IChartData {
   buckets: Array<number>,
   operators: Array<string>,
   relativeFrquencies: Array<number>,
}

const startSize = {
   width: 750,
   height: 200,
}

class SwimLanes extends React.Component<Props, State> {

   chartWrapper = createRef<HTMLDivElement>();

   constructor(props: Props) {
      super(props);
      this.state = {
         chartId: this.props.chartIdCounter,
         width: startSize.width,
         height: startSize.height,
         chartData: undefined,
         interpolation: "basis",
         bucketsize: 0.2,
      };
      this.props.setChartIdCounter(this.state.chartId + 1);

      this.createVisualizationSpec = this.createVisualizationSpec.bind(this);
      this.handleInterpolationChange = this.handleInterpolationChange.bind(this);
      this.handleBucketsizeChange = this.handleBucketsizeChange.bind(this);
   }

   componentDidUpdate(prevProps: Props, prevState: State): void {

      //ensure changed app state and only proceed when result available
      if (!this.props.resultLoading && prevProps.resultLoading != this.props.resultLoading) {

         const chartDataElement: IChartData = {
            buckets: ((this.props.chartData[this.state.chartId] as model.ChartDataObject).chartData.data as model.ISwimlanesData).buckets,
            operators: ((this.props.chartData[this.state.chartId] as model.ChartDataObject).chartData.data as model.ISwimlanesData).operators,
            relativeFrquencies: ((this.props.chartData[this.state.chartId] as model.ChartDataObject).chartData.data as model.ISwimlanesData).relativeFrquencies,
         }

         this.setState((state, props) => {
            return {
               ...this.state,
               chartData: chartDataElement,
            }
         });

      }

      //if current event, chart or bucketsize changes, component did update is executed and queries new data for new event
      if (this.props.currentEvent != prevProps.currentEvent || this.state.bucketsize != prevState.bucketsize || this.props.currentChart != prevProps.currentChart) {
         requestChartData(this.props.appContext.controller, this.state.chartId, ChartType.SWIM_LANES, {bucksetsize: "" + this.state.bucketsize});
      }

   }


   componentDidMount() {
      if (this.props.csvParsingFinished) {
         this.props.setCurrentChart(ChartType.SWIM_LANES);

         addEventListener('resize', (event) => {
            this.resizeListener();
         });
      }
   }

   componentWillUnmount() {
      removeEventListener('resize', (event) => {
         this.resizeListener();
      });
   }

   resizeListener() {
      if (!this.chartWrapper) return;

      const child = this.chartWrapper.current;
      if (child) {
         const newWidth = child.clientWidth;
         const newHeight = child.clientHeight;

         child.style.display = 'none';

         this.setState((state, props) => ({
            ...state,
            width: newWidth > startSize.width ? startSize.width : newWidth,
            //height: newHeight,
         }));

         child.style.display = 'block';
      }
   }

   handleInterpolationChange(newInterpolation: string) {
      this.setState({
         ...this.state,
         interpolation: newInterpolation,
      });
   }

   handleBucketsizeChange(newBucketsize: number) {
      this.setState({
         ...this.state,
         bucketsize: newBucketsize,
      });
   }


   public render() {

      const interpolationDropdownProps = {
         currentInterpolation: this.state.interpolation,
         changeInterpolation: this.handleInterpolationChange,
      }

      const bucketsizeDropdownProps = {
         currentBucketsize: this.state.bucketsize,
         changeBucketsize: this.handleBucketsizeChange,
      }

      if (!this.props.csvParsingFinished) {
         return <Redirect to={"/upload"} />
      }

      return <div>
         <div className={styles.resultArea} >
            <div className={styles.optionsArea} >
               <EventsButtons />
               <div className={styles.dropdownArea} >
                  <InterpolationDropdown {...interpolationDropdownProps}></InterpolationDropdown>
                  <BucketsizeDropdwn {...bucketsizeDropdownProps}></BucketsizeDropdwn>
               </div>
            </div>
            {(this.props.resultLoading || !this.state.chartData || !this.props.events)
               ? <CircularProgress  /> 
               : <div className={"vegaContainer"} ref={this.chartWrapper}>
                  <Vega className={`vegaSwimlaneTotal}`} spec={this.createVisualizationSpec()} />
               </div>
            }
         </div>
         <Vega className={`vegaStreamgraph`} spec={this.createVisualizationSpecStream()} />
      </div>;
   }

   createVisualizationSpecStream() {

      const data = [
         {
            "series": "Government",
            "year": 2000,
            "month": 1,
            "count": 430,
            "rate": 2.1,
            "date": "2000-01-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2000,
            "month": 2,
            "count": 409,
            "rate": 2,
            "date": "2000-02-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2000,
            "month": 3,
            "count": 311,
            "rate": 1.5,
            "date": "2000-03-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2000,
            "month": 4,
            "count": 269,
            "rate": 1.3,
            "date": "2000-04-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2000,
            "month": 5,
            "count": 370,
            "rate": 1.9,
            "date": "2000-05-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2000,
            "month": 6,
            "count": 603,
            "rate": 3.1,
            "date": "2000-06-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2000,
            "month": 7,
            "count": 545,
            "rate": 2.9,
            "date": "2000-07-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2000,
            "month": 8,
            "count": 583,
            "rate": 3.1,
            "date": "2000-08-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2000,
            "month": 9,
            "count": 408,
            "rate": 2.1,
            "date": "2000-09-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2000,
            "month": 10,
            "count": 391,
            "rate": 2,
            "date": "2000-10-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2000,
            "month": 11,
            "count": 384,
            "rate": 1.9,
            "date": "2000-11-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2000,
            "month": 12,
            "count": 365,
            "rate": 1.8,
            "date": "2000-12-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2001,
            "month": 1,
            "count": 463,
            "rate": 2.3,
            "date": "2001-01-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2001,
            "month": 2,
            "count": 298,
            "rate": 1.5,
            "date": "2001-02-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2001,
            "month": 3,
            "count": 355,
            "rate": 1.8,
            "date": "2001-03-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2001,
            "month": 4,
            "count": 369,
            "rate": 1.9,
            "date": "2001-04-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2001,
            "month": 5,
            "count": 361,
            "rate": 1.8,
            "date": "2001-05-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2001,
            "month": 6,
            "count": 525,
            "rate": 2.7,
            "date": "2001-06-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2001,
            "month": 7,
            "count": 548,
            "rate": 2.8,
            "date": "2001-07-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2001,
            "month": 8,
            "count": 540,
            "rate": 2.8,
            "date": "2001-08-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2001,
            "month": 9,
            "count": 438,
            "rate": 2.2,
            "date": "2001-09-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2001,
            "month": 10,
            "count": 429,
            "rate": 2.2,
            "date": "2001-10-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2001,
            "month": 11,
            "count": 420,
            "rate": 2.1,
            "date": "2001-11-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2001,
            "month": 12,
            "count": 419,
            "rate": 2.1,
            "date": "2001-12-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2002,
            "month": 1,
            "count": 486,
            "rate": 2.4,
            "date": "2002-01-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2002,
            "month": 2,
            "count": 508,
            "rate": 2.5,
            "date": "2002-02-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2002,
            "month": 3,
            "count": 477,
            "rate": 2.4,
            "date": "2002-03-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2002,
            "month": 4,
            "count": 447,
            "rate": 2.2,
            "date": "2002-04-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2002,
            "month": 5,
            "count": 484,
            "rate": 2.3,
            "date": "2002-05-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2002,
            "month": 6,
            "count": 561,
            "rate": 2.8,
            "date": "2002-06-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2002,
            "month": 7,
            "count": 645,
            "rate": 3.2,
            "date": "2002-07-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2002,
            "month": 8,
            "count": 596,
            "rate": 3,
            "date": "2002-08-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2002,
            "month": 9,
            "count": 530,
            "rate": 2.6,
            "date": "2002-09-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2002,
            "month": 10,
            "count": 499,
            "rate": 2.5,
            "date": "2002-10-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2002,
            "month": 11,
            "count": 468,
            "rate": 2.3,
            "date": "2002-11-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2002,
            "month": 12,
            "count": 446,
            "rate": 2.2,
            "date": "2002-12-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2003,
            "month": 1,
            "count": 571,
            "rate": 2.8,
            "date": "2003-01-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2003,
            "month": 2,
            "count": 483,
            "rate": 2.4,
            "date": "2003-02-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2003,
            "month": 3,
            "count": 526,
            "rate": 2.6,
            "date": "2003-03-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2003,
            "month": 4,
            "count": 440,
            "rate": 2.2,
            "date": "2003-04-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2003,
            "month": 5,
            "count": 478,
            "rate": 2.4,
            "date": "2003-05-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2003,
            "month": 6,
            "count": 704,
            "rate": 3.5,
            "date": "2003-06-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2003,
            "month": 7,
            "count": 749,
            "rate": 3.8,
            "date": "2003-07-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2003,
            "month": 8,
            "count": 745,
            "rate": 3.7,
            "date": "2003-08-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2003,
            "month": 9,
            "count": 556,
            "rate": 2.7,
            "date": "2003-09-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2003,
            "month": 10,
            "count": 500,
            "rate": 2.4,
            "date": "2003-10-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2003,
            "month": 11,
            "count": 542,
            "rate": 2.7,
            "date": "2003-11-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2003,
            "month": 12,
            "count": 516,
            "rate": 2.5,
            "date": "2003-12-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2004,
            "month": 1,
            "count": 511,
            "rate": 2.5,
            "date": "2004-01-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2004,
            "month": 2,
            "count": 490,
            "rate": 2.4,
            "date": "2004-02-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2004,
            "month": 3,
            "count": 530,
            "rate": 2.6,
            "date": "2004-03-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2004,
            "month": 4,
            "count": 433,
            "rate": 2.1,
            "date": "2004-04-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2004,
            "month": 5,
            "count": 468,
            "rate": 2.3,
            "date": "2004-05-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2004,
            "month": 6,
            "count": 580,
            "rate": 2.8,
            "date": "2004-06-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2004,
            "month": 7,
            "count": 741,
            "rate": 3.7,
            "date": "2004-07-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2004,
            "month": 8,
            "count": 676,
            "rate": 3.3,
            "date": "2004-08-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2004,
            "month": 9,
            "count": 568,
            "rate": 2.7,
            "date": "2004-09-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2004,
            "month": 10,
            "count": 561,
            "rate": 2.7,
            "date": "2004-10-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2004,
            "month": 11,
            "count": 514,
            "rate": 2.4,
            "date": "2004-11-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2004,
            "month": 12,
            "count": 499,
            "rate": 2.4,
            "date": "2004-12-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2005,
            "month": 1,
            "count": 555,
            "rate": 2.6,
            "date": "2005-01-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2005,
            "month": 2,
            "count": 472,
            "rate": 2.3,
            "date": "2005-02-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2005,
            "month": 3,
            "count": 468,
            "rate": 2.2,
            "date": "2005-03-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2005,
            "month": 4,
            "count": 478,
            "rate": 2.3,
            "date": "2005-04-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2005,
            "month": 5,
            "count": 453,
            "rate": 2.1,
            "date": "2005-05-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2005,
            "month": 6,
            "count": 681,
            "rate": 3.2,
            "date": "2005-06-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2005,
            "month": 7,
            "count": 683,
            "rate": 3.3,
            "date": "2005-07-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2005,
            "month": 8,
            "count": 664,
            "rate": 3.2,
            "date": "2005-08-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2005,
            "month": 9,
            "count": 568,
            "rate": 2.7,
            "date": "2005-09-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2005,
            "month": 10,
            "count": 502,
            "rate": 2.4,
            "date": "2005-10-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2005,
            "month": 11,
            "count": 494,
            "rate": 2.4,
            "date": "2005-11-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2005,
            "month": 12,
            "count": 393,
            "rate": 1.9,
            "date": "2005-12-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2006,
            "month": 1,
            "count": 457,
            "rate": 2.2,
            "date": "2006-01-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2006,
            "month": 2,
            "count": 472,
            "rate": 2.3,
            "date": "2006-02-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2006,
            "month": 3,
            "count": 461,
            "rate": 2.2,
            "date": "2006-03-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2006,
            "month": 4,
            "count": 414,
            "rate": 2,
            "date": "2006-04-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2006,
            "month": 5,
            "count": 429,
            "rate": 2.1,
            "date": "2006-05-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2006,
            "month": 6,
            "count": 578,
            "rate": 2.8,
            "date": "2006-06-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2006,
            "month": 7,
            "count": 659,
            "rate": 3.2,
            "date": "2006-07-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2006,
            "month": 8,
            "count": 595,
            "rate": 2.9,
            "date": "2006-08-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2006,
            "month": 9,
            "count": 396,
            "rate": 1.9,
            "date": "2006-09-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2006,
            "month": 10,
            "count": 424,
            "rate": 2,
            "date": "2006-10-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2006,
            "month": 11,
            "count": 400,
            "rate": 1.9,
            "date": "2006-11-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2006,
            "month": 12,
            "count": 395,
            "rate": 1.9,
            "date": "2006-12-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2007,
            "month": 1,
            "count": 476,
            "rate": 2.2,
            "date": "2007-01-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2007,
            "month": 2,
            "count": 405,
            "rate": 1.9,
            "date": "2007-02-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2007,
            "month": 3,
            "count": 419,
            "rate": 1.9,
            "date": "2007-03-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2007,
            "month": 4,
            "count": 408,
            "rate": 1.9,
            "date": "2007-04-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2007,
            "month": 5,
            "count": 428,
            "rate": 1.9,
            "date": "2007-05-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2007,
            "month": 6,
            "count": 572,
            "rate": 2.7,
            "date": "2007-06-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2007,
            "month": 7,
            "count": 704,
            "rate": 3.3,
            "date": "2007-07-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2007,
            "month": 8,
            "count": 695,
            "rate": 3.2,
            "date": "2007-08-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2007,
            "month": 9,
            "count": 525,
            "rate": 2.4,
            "date": "2007-09-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2007,
            "month": 10,
            "count": 492,
            "rate": 2.3,
            "date": "2007-10-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2007,
            "month": 11,
            "count": 482,
            "rate": 2.2,
            "date": "2007-11-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2007,
            "month": 12,
            "count": 451,
            "rate": 2.1,
            "date": "2007-12-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2008,
            "month": 1,
            "count": 471,
            "rate": 2.2,
            "date": "2008-01-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2008,
            "month": 2,
            "count": 372,
            "rate": 1.7,
            "date": "2008-02-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2008,
            "month": 3,
            "count": 425,
            "rate": 1.9,
            "date": "2008-03-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2008,
            "month": 4,
            "count": 373,
            "rate": 1.7,
            "date": "2008-04-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2008,
            "month": 5,
            "count": 461,
            "rate": 2.1,
            "date": "2008-05-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2008,
            "month": 6,
            "count": 654,
            "rate": 3,
            "date": "2008-06-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2008,
            "month": 7,
            "count": 770,
            "rate": 3.6,
            "date": "2008-07-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2008,
            "month": 8,
            "count": 721,
            "rate": 3.3,
            "date": "2008-08-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2008,
            "month": 9,
            "count": 573,
            "rate": 2.6,
            "date": "2008-09-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2008,
            "month": 10,
            "count": 552,
            "rate": 2.5,
            "date": "2008-10-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2008,
            "month": 11,
            "count": 527,
            "rate": 2.4,
            "date": "2008-11-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2008,
            "month": 12,
            "count": 511,
            "rate": 2.3,
            "date": "2008-12-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2009,
            "month": 1,
            "count": 652,
            "rate": 3,
            "date": "2009-01-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2009,
            "month": 2,
            "count": 563,
            "rate": 2.6,
            "date": "2009-02-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2009,
            "month": 3,
            "count": 598,
            "rate": 2.8,
            "date": "2009-03-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2009,
            "month": 4,
            "count": 575,
            "rate": 2.6,
            "date": "2009-04-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2009,
            "month": 5,
            "count": 702,
            "rate": 3.1,
            "date": "2009-05-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2009,
            "month": 6,
            "count": 991,
            "rate": 4.4,
            "date": "2009-06-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2009,
            "month": 7,
            "count": 1129,
            "rate": 5.1,
            "date": "2009-07-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2009,
            "month": 8,
            "count": 1118,
            "rate": 5.1,
            "date": "2009-08-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2009,
            "month": 9,
            "count": 928,
            "rate": 4.2,
            "date": "2009-09-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2009,
            "month": 10,
            "count": 785,
            "rate": 3.5,
            "date": "2009-10-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2009,
            "month": 11,
            "count": 748,
            "rate": 3.4,
            "date": "2009-11-01T07:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2009,
            "month": 12,
            "count": 797,
            "rate": 3.6,
            "date": "2009-12-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2010,
            "month": 1,
            "count": 948,
            "rate": 4.3,
            "date": "2010-01-01T08:00:00.000Z"
         },
         {
            "series": "Government",
            "year": 2010,
            "month": 2,
            "count": 880,
            "rate": 4,
            "date": "2010-02-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2000,
            "month": 1,
            "count": 19,
            "rate": 3.9,
            "date": "2000-01-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2000,
            "month": 2,
            "count": 25,
            "rate": 5.5,
            "date": "2000-02-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2000,
            "month": 3,
            "count": 17,
            "rate": 3.7,
            "date": "2000-03-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2000,
            "month": 4,
            "count": 20,
            "rate": 4.1,
            "date": "2000-04-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2000,
            "month": 5,
            "count": 27,
            "rate": 5.3,
            "date": "2000-05-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2000,
            "month": 6,
            "count": 13,
            "rate": 2.6,
            "date": "2000-06-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2000,
            "month": 7,
            "count": 16,
            "rate": 3.6,
            "date": "2000-07-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2000,
            "month": 8,
            "count": 23,
            "rate": 5.1,
            "date": "2000-08-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2000,
            "month": 9,
            "count": 25,
            "rate": 5.8,
            "date": "2000-09-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2000,
            "month": 10,
            "count": 39,
            "rate": 7.8,
            "date": "2000-10-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2000,
            "month": 11,
            "count": 11,
            "rate": 2,
            "date": "2000-11-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2000,
            "month": 12,
            "count": 20,
            "rate": 3.8,
            "date": "2000-12-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2001,
            "month": 1,
            "count": 11,
            "rate": 2.3,
            "date": "2001-01-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2001,
            "month": 2,
            "count": 27,
            "rate": 5.3,
            "date": "2001-02-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2001,
            "month": 3,
            "count": 14,
            "rate": 3,
            "date": "2001-03-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2001,
            "month": 4,
            "count": 24,
            "rate": 4.7,
            "date": "2001-04-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2001,
            "month": 5,
            "count": 34,
            "rate": 5.9,
            "date": "2001-05-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2001,
            "month": 6,
            "count": 26,
            "rate": 4.7,
            "date": "2001-06-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2001,
            "month": 7,
            "count": 17,
            "rate": 3.1,
            "date": "2001-07-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2001,
            "month": 8,
            "count": 18,
            "rate": 3.3,
            "date": "2001-08-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2001,
            "month": 9,
            "count": 23,
            "rate": 4.2,
            "date": "2001-09-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2001,
            "month": 10,
            "count": 32,
            "rate": 5.4,
            "date": "2001-10-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2001,
            "month": 11,
            "count": 20,
            "rate": 3.6,
            "date": "2001-11-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2001,
            "month": 12,
            "count": 27,
            "rate": 5.3,
            "date": "2001-12-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2002,
            "month": 1,
            "count": 33,
            "rate": 7,
            "date": "2002-01-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2002,
            "month": 2,
            "count": 35,
            "rate": 7.5,
            "date": "2002-02-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2002,
            "month": 3,
            "count": 28,
            "rate": 5.3,
            "date": "2002-03-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2002,
            "month": 4,
            "count": 33,
            "rate": 6.1,
            "date": "2002-04-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2002,
            "month": 5,
            "count": 25,
            "rate": 4.9,
            "date": "2002-05-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2002,
            "month": 6,
            "count": 35,
            "rate": 7.1,
            "date": "2002-06-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2002,
            "month": 7,
            "count": 19,
            "rate": 3.9,
            "date": "2002-07-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2002,
            "month": 8,
            "count": 32,
            "rate": 6.3,
            "date": "2002-08-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2002,
            "month": 9,
            "count": 42,
            "rate": 7.9,
            "date": "2002-09-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2002,
            "month": 10,
            "count": 36,
            "rate": 6.4,
            "date": "2002-10-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2002,
            "month": 11,
            "count": 32,
            "rate": 5.4,
            "date": "2002-11-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2002,
            "month": 12,
            "count": 45,
            "rate": 7.8,
            "date": "2002-12-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2003,
            "month": 1,
            "count": 54,
            "rate": 9,
            "date": "2003-01-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2003,
            "month": 2,
            "count": 41,
            "rate": 7.1,
            "date": "2003-02-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2003,
            "month": 3,
            "count": 46,
            "rate": 8.2,
            "date": "2003-03-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2003,
            "month": 4,
            "count": 41,
            "rate": 7.7,
            "date": "2003-04-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2003,
            "month": 5,
            "count": 40,
            "rate": 7.5,
            "date": "2003-05-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2003,
            "month": 6,
            "count": 36,
            "rate": 6.8,
            "date": "2003-06-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2003,
            "month": 7,
            "count": 43,
            "rate": 7.9,
            "date": "2003-07-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2003,
            "month": 8,
            "count": 20,
            "rate": 3.8,
            "date": "2003-08-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2003,
            "month": 9,
            "count": 25,
            "rate": 4.6,
            "date": "2003-09-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2003,
            "month": 10,
            "count": 31,
            "rate": 5.6,
            "date": "2003-10-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2003,
            "month": 11,
            "count": 34,
            "rate": 5.9,
            "date": "2003-11-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2003,
            "month": 12,
            "count": 32,
            "rate": 5.6,
            "date": "2003-12-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2004,
            "month": 1,
            "count": 31,
            "rate": 5.8,
            "date": "2004-01-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2004,
            "month": 2,
            "count": 24,
            "rate": 5,
            "date": "2004-02-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2004,
            "month": 3,
            "count": 22,
            "rate": 4.4,
            "date": "2004-03-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2004,
            "month": 4,
            "count": 34,
            "rate": 6.4,
            "date": "2004-04-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2004,
            "month": 5,
            "count": 22,
            "rate": 4.3,
            "date": "2004-05-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2004,
            "month": 6,
            "count": 27,
            "rate": 5,
            "date": "2004-06-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2004,
            "month": 7,
            "count": 28,
            "rate": 5.4,
            "date": "2004-07-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2004,
            "month": 8,
            "count": 10,
            "rate": 1.9,
            "date": "2004-08-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2004,
            "month": 9,
            "count": 8,
            "rate": 1.5,
            "date": "2004-09-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2004,
            "month": 10,
            "count": 15,
            "rate": 2.6,
            "date": "2004-10-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2004,
            "month": 11,
            "count": 20,
            "rate": 3.3,
            "date": "2004-11-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2004,
            "month": 12,
            "count": 16,
            "rate": 2.5,
            "date": "2004-12-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2005,
            "month": 1,
            "count": 29,
            "rate": 4.9,
            "date": "2005-01-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2005,
            "month": 2,
            "count": 25,
            "rate": 4,
            "date": "2005-02-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2005,
            "month": 3,
            "count": 32,
            "rate": 5.2,
            "date": "2005-03-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2005,
            "month": 4,
            "count": 19,
            "rate": 2.9,
            "date": "2005-04-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2005,
            "month": 5,
            "count": 16,
            "rate": 2.4,
            "date": "2005-05-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2005,
            "month": 6,
            "count": 25,
            "rate": 4,
            "date": "2005-06-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2005,
            "month": 7,
            "count": 22,
            "rate": 3.7,
            "date": "2005-07-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2005,
            "month": 8,
            "count": 12,
            "rate": 2,
            "date": "2005-08-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2005,
            "month": 9,
            "count": 12,
            "rate": 2,
            "date": "2005-09-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2005,
            "month": 10,
            "count": 2,
            "rate": 0.3,
            "date": "2005-10-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2005,
            "month": 11,
            "count": 18,
            "rate": 2.9,
            "date": "2005-11-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2005,
            "month": 12,
            "count": 23,
            "rate": 3.5,
            "date": "2005-12-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2006,
            "month": 1,
            "count": 26,
            "rate": 3.9,
            "date": "2006-01-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2006,
            "month": 2,
            "count": 25,
            "rate": 3.8,
            "date": "2006-02-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2006,
            "month": 3,
            "count": 14,
            "rate": 2.1,
            "date": "2006-03-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2006,
            "month": 4,
            "count": 17,
            "rate": 2.5,
            "date": "2006-04-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2006,
            "month": 5,
            "count": 20,
            "rate": 2.8,
            "date": "2006-05-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2006,
            "month": 6,
            "count": 31,
            "rate": 4.3,
            "date": "2006-06-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2006,
            "month": 7,
            "count": 25,
            "rate": 3.5,
            "date": "2006-07-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2006,
            "month": 8,
            "count": 32,
            "rate": 4.3,
            "date": "2006-08-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2006,
            "month": 9,
            "count": 14,
            "rate": 2.1,
            "date": "2006-09-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2006,
            "month": 10,
            "count": 15,
            "rate": 2.2,
            "date": "2006-10-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2006,
            "month": 11,
            "count": 22,
            "rate": 2.9,
            "date": "2006-11-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2006,
            "month": 12,
            "count": 25,
            "rate": 3.4,
            "date": "2006-12-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2007,
            "month": 1,
            "count": 35,
            "rate": 4.7,
            "date": "2007-01-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2007,
            "month": 2,
            "count": 33,
            "rate": 4.5,
            "date": "2007-02-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2007,
            "month": 3,
            "count": 24,
            "rate": 3.2,
            "date": "2007-03-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2007,
            "month": 4,
            "count": 17,
            "rate": 2.3,
            "date": "2007-04-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2007,
            "month": 5,
            "count": 22,
            "rate": 3,
            "date": "2007-05-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2007,
            "month": 6,
            "count": 33,
            "rate": 4.3,
            "date": "2007-06-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2007,
            "month": 7,
            "count": 33,
            "rate": 4.3,
            "date": "2007-07-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2007,
            "month": 8,
            "count": 33,
            "rate": 4.6,
            "date": "2007-08-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2007,
            "month": 9,
            "count": 25,
            "rate": 3.2,
            "date": "2007-09-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2007,
            "month": 10,
            "count": 9,
            "rate": 1.3,
            "date": "2007-10-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2007,
            "month": 11,
            "count": 16,
            "rate": 2.3,
            "date": "2007-11-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2007,
            "month": 12,
            "count": 24,
            "rate": 3.4,
            "date": "2007-12-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2008,
            "month": 1,
            "count": 28,
            "rate": 4,
            "date": "2008-01-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2008,
            "month": 2,
            "count": 16,
            "rate": 2.2,
            "date": "2008-02-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2008,
            "month": 3,
            "count": 28,
            "rate": 3.7,
            "date": "2008-03-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2008,
            "month": 4,
            "count": 28,
            "rate": 3.6,
            "date": "2008-04-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2008,
            "month": 5,
            "count": 28,
            "rate": 3.4,
            "date": "2008-05-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2008,
            "month": 6,
            "count": 28,
            "rate": 3.3,
            "date": "2008-06-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2008,
            "month": 7,
            "count": 13,
            "rate": 1.5,
            "date": "2008-07-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2008,
            "month": 8,
            "count": 17,
            "rate": 1.9,
            "date": "2008-08-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2008,
            "month": 9,
            "count": 25,
            "rate": 2.8,
            "date": "2008-09-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2008,
            "month": 10,
            "count": 15,
            "rate": 1.7,
            "date": "2008-10-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2008,
            "month": 11,
            "count": 32,
            "rate": 3.7,
            "date": "2008-11-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2008,
            "month": 12,
            "count": 46,
            "rate": 5.2,
            "date": "2008-12-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2009,
            "month": 1,
            "count": 59,
            "rate": 7,
            "date": "2009-01-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2009,
            "month": 2,
            "count": 63,
            "rate": 7.6,
            "date": "2009-02-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2009,
            "month": 3,
            "count": 105,
            "rate": 12.6,
            "date": "2009-03-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2009,
            "month": 4,
            "count": 125,
            "rate": 16.1,
            "date": "2009-04-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2009,
            "month": 5,
            "count": 98,
            "rate": 13.3,
            "date": "2009-05-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2009,
            "month": 6,
            "count": 100,
            "rate": 13.6,
            "date": "2009-06-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2009,
            "month": 7,
            "count": 95,
            "rate": 12.6,
            "date": "2009-07-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2009,
            "month": 8,
            "count": 93,
            "rate": 11.8,
            "date": "2009-08-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2009,
            "month": 9,
            "count": 76,
            "rate": 10.7,
            "date": "2009-09-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2009,
            "month": 10,
            "count": 84,
            "rate": 10.8,
            "date": "2009-10-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2009,
            "month": 11,
            "count": 96,
            "rate": 12,
            "date": "2009-11-01T07:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2009,
            "month": 12,
            "count": 89,
            "rate": 11.8,
            "date": "2009-12-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2010,
            "month": 1,
            "count": 68,
            "rate": 9.1,
            "date": "2010-01-01T08:00:00.000Z"
         },
         {
            "series": "Mining and Extraction",
            "year": 2010,
            "month": 2,
            "count": 79,
            "rate": 10.7,
            "date": "2010-02-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2000,
            "month": 1,
            "count": 745,
            "rate": 9.7,
            "date": "2000-01-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2000,
            "month": 2,
            "count": 812,
            "rate": 10.6,
            "date": "2000-02-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2000,
            "month": 3,
            "count": 669,
            "rate": 8.7,
            "date": "2000-03-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2000,
            "month": 4,
            "count": 447,
            "rate": 5.8,
            "date": "2000-04-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2000,
            "month": 5,
            "count": 397,
            "rate": 5,
            "date": "2000-05-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2000,
            "month": 6,
            "count": 389,
            "rate": 4.6,
            "date": "2000-06-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2000,
            "month": 7,
            "count": 384,
            "rate": 4.4,
            "date": "2000-07-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2000,
            "month": 8,
            "count": 446,
            "rate": 5.1,
            "date": "2000-08-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2000,
            "month": 9,
            "count": 386,
            "rate": 4.6,
            "date": "2000-09-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2000,
            "month": 10,
            "count": 417,
            "rate": 4.9,
            "date": "2000-10-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2000,
            "month": 11,
            "count": 482,
            "rate": 5.7,
            "date": "2000-11-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2000,
            "month": 12,
            "count": 580,
            "rate": 6.8,
            "date": "2000-12-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2001,
            "month": 1,
            "count": 836,
            "rate": 9.8,
            "date": "2001-01-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2001,
            "month": 2,
            "count": 826,
            "rate": 9.9,
            "date": "2001-02-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2001,
            "month": 3,
            "count": 683,
            "rate": 8.4,
            "date": "2001-03-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2001,
            "month": 4,
            "count": 596,
            "rate": 7.1,
            "date": "2001-04-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2001,
            "month": 5,
            "count": 478,
            "rate": 5.6,
            "date": "2001-05-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2001,
            "month": 6,
            "count": 443,
            "rate": 5.1,
            "date": "2001-06-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2001,
            "month": 7,
            "count": 447,
            "rate": 4.9,
            "date": "2001-07-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2001,
            "month": 8,
            "count": 522,
            "rate": 5.8,
            "date": "2001-08-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2001,
            "month": 9,
            "count": 489,
            "rate": 5.5,
            "date": "2001-09-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2001,
            "month": 10,
            "count": 535,
            "rate": 6.1,
            "date": "2001-10-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2001,
            "month": 11,
            "count": 670,
            "rate": 7.6,
            "date": "2001-11-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2001,
            "month": 12,
            "count": 785,
            "rate": 9,
            "date": "2001-12-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2002,
            "month": 1,
            "count": 1211,
            "rate": 13.6,
            "date": "2002-01-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2002,
            "month": 2,
            "count": 1060,
            "rate": 12.2,
            "date": "2002-02-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2002,
            "month": 3,
            "count": 1009,
            "rate": 11.8,
            "date": "2002-03-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2002,
            "month": 4,
            "count": 855,
            "rate": 10.1,
            "date": "2002-04-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2002,
            "month": 5,
            "count": 626,
            "rate": 7.4,
            "date": "2002-05-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2002,
            "month": 6,
            "count": 593,
            "rate": 6.9,
            "date": "2002-06-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2002,
            "month": 7,
            "count": 594,
            "rate": 6.9,
            "date": "2002-07-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2002,
            "month": 8,
            "count": 654,
            "rate": 7.4,
            "date": "2002-08-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2002,
            "month": 9,
            "count": 615,
            "rate": 7,
            "date": "2002-09-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2002,
            "month": 10,
            "count": 680,
            "rate": 7.7,
            "date": "2002-10-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2002,
            "month": 11,
            "count": 758,
            "rate": 8.5,
            "date": "2002-11-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2002,
            "month": 12,
            "count": 941,
            "rate": 10.9,
            "date": "2002-12-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2003,
            "month": 1,
            "count": 1196,
            "rate": 14,
            "date": "2003-01-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2003,
            "month": 2,
            "count": 1173,
            "rate": 14,
            "date": "2003-02-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2003,
            "month": 3,
            "count": 987,
            "rate": 11.8,
            "date": "2003-03-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2003,
            "month": 4,
            "count": 772,
            "rate": 9.3,
            "date": "2003-04-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2003,
            "month": 5,
            "count": 715,
            "rate": 8.4,
            "date": "2003-05-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2003,
            "month": 6,
            "count": 710,
            "rate": 7.9,
            "date": "2003-06-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2003,
            "month": 7,
            "count": 677,
            "rate": 7.5,
            "date": "2003-07-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2003,
            "month": 8,
            "count": 650,
            "rate": 7.1,
            "date": "2003-08-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2003,
            "month": 9,
            "count": 681,
            "rate": 7.6,
            "date": "2003-09-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2003,
            "month": 10,
            "count": 651,
            "rate": 7.4,
            "date": "2003-10-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2003,
            "month": 11,
            "count": 690,
            "rate": 7.8,
            "date": "2003-11-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2003,
            "month": 12,
            "count": 813,
            "rate": 9.3,
            "date": "2003-12-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2004,
            "month": 1,
            "count": 994,
            "rate": 11.3,
            "date": "2004-01-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2004,
            "month": 2,
            "count": 1039,
            "rate": 11.6,
            "date": "2004-02-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2004,
            "month": 3,
            "count": 1011,
            "rate": 11.3,
            "date": "2004-03-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2004,
            "month": 4,
            "count": 849,
            "rate": 9.5,
            "date": "2004-04-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2004,
            "month": 5,
            "count": 665,
            "rate": 7.4,
            "date": "2004-05-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2004,
            "month": 6,
            "count": 668,
            "rate": 7,
            "date": "2004-06-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2004,
            "month": 7,
            "count": 610,
            "rate": 6.4,
            "date": "2004-07-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2004,
            "month": 8,
            "count": 563,
            "rate": 6,
            "date": "2004-08-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2004,
            "month": 9,
            "count": 629,
            "rate": 6.8,
            "date": "2004-09-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2004,
            "month": 10,
            "count": 635,
            "rate": 6.9,
            "date": "2004-10-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2004,
            "month": 11,
            "count": 695,
            "rate": 7.4,
            "date": "2004-11-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2004,
            "month": 12,
            "count": 870,
            "rate": 9.5,
            "date": "2004-12-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2005,
            "month": 1,
            "count": 1079,
            "rate": 11.8,
            "date": "2005-01-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2005,
            "month": 2,
            "count": 1150,
            "rate": 12.3,
            "date": "2005-02-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2005,
            "month": 3,
            "count": 961,
            "rate": 10.3,
            "date": "2005-03-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2005,
            "month": 4,
            "count": 693,
            "rate": 7.4,
            "date": "2005-04-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2005,
            "month": 5,
            "count": 567,
            "rate": 6.1,
            "date": "2005-05-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2005,
            "month": 6,
            "count": 559,
            "rate": 5.7,
            "date": "2005-06-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2005,
            "month": 7,
            "count": 509,
            "rate": 5.2,
            "date": "2005-07-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2005,
            "month": 8,
            "count": 561,
            "rate": 5.7,
            "date": "2005-08-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2005,
            "month": 9,
            "count": 572,
            "rate": 5.7,
            "date": "2005-09-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2005,
            "month": 10,
            "count": 519,
            "rate": 5.3,
            "date": "2005-10-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2005,
            "month": 11,
            "count": 564,
            "rate": 5.7,
            "date": "2005-11-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2005,
            "month": 12,
            "count": 813,
            "rate": 8.2,
            "date": "2005-12-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2006,
            "month": 1,
            "count": 868,
            "rate": 9,
            "date": "2006-01-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2006,
            "month": 2,
            "count": 836,
            "rate": 8.6,
            "date": "2006-02-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2006,
            "month": 3,
            "count": 820,
            "rate": 8.5,
            "date": "2006-03-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2006,
            "month": 4,
            "count": 674,
            "rate": 6.9,
            "date": "2006-04-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2006,
            "month": 5,
            "count": 647,
            "rate": 6.6,
            "date": "2006-05-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2006,
            "month": 6,
            "count": 569,
            "rate": 5.6,
            "date": "2006-06-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2006,
            "month": 7,
            "count": 633,
            "rate": 6.1,
            "date": "2006-07-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2006,
            "month": 8,
            "count": 618,
            "rate": 5.9,
            "date": "2006-08-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2006,
            "month": 9,
            "count": 586,
            "rate": 5.6,
            "date": "2006-09-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2006,
            "month": 10,
            "count": 456,
            "rate": 4.5,
            "date": "2006-10-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2006,
            "month": 11,
            "count": 618,
            "rate": 6,
            "date": "2006-11-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2006,
            "month": 12,
            "count": 725,
            "rate": 6.9,
            "date": "2006-12-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2007,
            "month": 1,
            "count": 922,
            "rate": 8.9,
            "date": "2007-01-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2007,
            "month": 2,
            "count": 1086,
            "rate": 10.5,
            "date": "2007-02-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2007,
            "month": 3,
            "count": 924,
            "rate": 9,
            "date": "2007-03-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2007,
            "month": 4,
            "count": 853,
            "rate": 8.6,
            "date": "2007-04-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2007,
            "month": 5,
            "count": 676,
            "rate": 6.9,
            "date": "2007-05-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2007,
            "month": 6,
            "count": 600,
            "rate": 5.9,
            "date": "2007-06-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2007,
            "month": 7,
            "count": 617,
            "rate": 5.9,
            "date": "2007-07-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2007,
            "month": 8,
            "count": 558,
            "rate": 5.3,
            "date": "2007-08-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2007,
            "month": 9,
            "count": 596,
            "rate": 5.8,
            "date": "2007-09-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2007,
            "month": 10,
            "count": 641,
            "rate": 6.1,
            "date": "2007-10-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2007,
            "month": 11,
            "count": 645,
            "rate": 6.2,
            "date": "2007-11-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2007,
            "month": 12,
            "count": 968,
            "rate": 9.4,
            "date": "2007-12-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2008,
            "month": 1,
            "count": 1099,
            "rate": 11,
            "date": "2008-01-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2008,
            "month": 2,
            "count": 1118,
            "rate": 11.4,
            "date": "2008-02-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2008,
            "month": 3,
            "count": 1170,
            "rate": 12,
            "date": "2008-03-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2008,
            "month": 4,
            "count": 1057,
            "rate": 11.1,
            "date": "2008-04-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2008,
            "month": 5,
            "count": 809,
            "rate": 8.6,
            "date": "2008-05-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2008,
            "month": 6,
            "count": 785,
            "rate": 8.2,
            "date": "2008-06-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2008,
            "month": 7,
            "count": 783,
            "rate": 8,
            "date": "2008-07-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2008,
            "month": 8,
            "count": 814,
            "rate": 8.2,
            "date": "2008-08-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2008,
            "month": 9,
            "count": 970,
            "rate": 9.9,
            "date": "2008-09-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2008,
            "month": 10,
            "count": 1078,
            "rate": 10.8,
            "date": "2008-10-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2008,
            "month": 11,
            "count": 1237,
            "rate": 12.7,
            "date": "2008-11-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2008,
            "month": 12,
            "count": 1438,
            "rate": 15.3,
            "date": "2008-12-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2009,
            "month": 1,
            "count": 1744,
            "rate": 18.2,
            "date": "2009-01-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2009,
            "month": 2,
            "count": 2025,
            "rate": 21.4,
            "date": "2009-02-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2009,
            "month": 3,
            "count": 1979,
            "rate": 21.1,
            "date": "2009-03-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2009,
            "month": 4,
            "count": 1737,
            "rate": 18.7,
            "date": "2009-04-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2009,
            "month": 5,
            "count": 1768,
            "rate": 19.2,
            "date": "2009-05-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2009,
            "month": 6,
            "count": 1601,
            "rate": 17.4,
            "date": "2009-06-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2009,
            "month": 7,
            "count": 1687,
            "rate": 18.2,
            "date": "2009-07-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2009,
            "month": 8,
            "count": 1542,
            "rate": 16.5,
            "date": "2009-08-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2009,
            "month": 9,
            "count": 1594,
            "rate": 17.1,
            "date": "2009-09-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2009,
            "month": 10,
            "count": 1744,
            "rate": 18.7,
            "date": "2009-10-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2009,
            "month": 11,
            "count": 1780,
            "rate": 19.4,
            "date": "2009-11-01T07:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2009,
            "month": 12,
            "count": 2044,
            "rate": 22.7,
            "date": "2009-12-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2010,
            "month": 1,
            "count": 2194,
            "rate": 24.7,
            "date": "2010-01-01T08:00:00.000Z"
         },
         {
            "series": "Construction",
            "year": 2010,
            "month": 2,
            "count": 2440,
            "rate": 27.1,
            "date": "2010-02-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2000,
            "month": 1,
            "count": 734,
            "rate": 3.6,
            "date": "2000-01-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2000,
            "month": 2,
            "count": 694,
            "rate": 3.4,
            "date": "2000-02-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2000,
            "month": 3,
            "count": 739,
            "rate": 3.6,
            "date": "2000-03-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2000,
            "month": 4,
            "count": 736,
            "rate": 3.7,
            "date": "2000-04-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2000,
            "month": 5,
            "count": 685,
            "rate": 3.4,
            "date": "2000-05-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2000,
            "month": 6,
            "count": 621,
            "rate": 3.1,
            "date": "2000-06-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2000,
            "month": 7,
            "count": 708,
            "rate": 3.6,
            "date": "2000-07-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2000,
            "month": 8,
            "count": 685,
            "rate": 3.4,
            "date": "2000-08-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2000,
            "month": 9,
            "count": 667,
            "rate": 3.4,
            "date": "2000-09-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2000,
            "month": 10,
            "count": 693,
            "rate": 3.6,
            "date": "2000-10-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2000,
            "month": 11,
            "count": 672,
            "rate": 3.4,
            "date": "2000-11-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2000,
            "month": 12,
            "count": 653,
            "rate": 3.3,
            "date": "2000-12-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2001,
            "month": 1,
            "count": 911,
            "rate": 4.6,
            "date": "2001-01-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2001,
            "month": 2,
            "count": 902,
            "rate": 4.6,
            "date": "2001-02-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2001,
            "month": 3,
            "count": 954,
            "rate": 4.9,
            "date": "2001-03-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2001,
            "month": 4,
            "count": 855,
            "rate": 4.4,
            "date": "2001-04-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2001,
            "month": 5,
            "count": 903,
            "rate": 4.7,
            "date": "2001-05-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2001,
            "month": 6,
            "count": 956,
            "rate": 5,
            "date": "2001-06-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2001,
            "month": 7,
            "count": 1054,
            "rate": 5.6,
            "date": "2001-07-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2001,
            "month": 8,
            "count": 1023,
            "rate": 5.5,
            "date": "2001-08-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2001,
            "month": 9,
            "count": 996,
            "rate": 5.4,
            "date": "2001-09-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2001,
            "month": 10,
            "count": 1065,
            "rate": 5.8,
            "date": "2001-10-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2001,
            "month": 11,
            "count": 1108,
            "rate": 6,
            "date": "2001-11-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2001,
            "month": 12,
            "count": 1172,
            "rate": 6.3,
            "date": "2001-12-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2002,
            "month": 1,
            "count": 1377,
            "rate": 7.4,
            "date": "2002-01-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2002,
            "month": 2,
            "count": 1296,
            "rate": 7,
            "date": "2002-02-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2002,
            "month": 3,
            "count": 1367,
            "rate": 7.3,
            "date": "2002-03-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2002,
            "month": 4,
            "count": 1322,
            "rate": 7.2,
            "date": "2002-04-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2002,
            "month": 5,
            "count": 1194,
            "rate": 6.6,
            "date": "2002-05-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2002,
            "month": 6,
            "count": 1187,
            "rate": 6.6,
            "date": "2002-06-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2002,
            "month": 7,
            "count": 1185,
            "rate": 6.6,
            "date": "2002-07-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2002,
            "month": 8,
            "count": 1108,
            "rate": 6.2,
            "date": "2002-08-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2002,
            "month": 9,
            "count": 1076,
            "rate": 6.1,
            "date": "2002-09-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2002,
            "month": 10,
            "count": 1046,
            "rate": 5.9,
            "date": "2002-10-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2002,
            "month": 11,
            "count": 1115,
            "rate": 6.3,
            "date": "2002-11-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2002,
            "month": 12,
            "count": 1188,
            "rate": 6.6,
            "date": "2002-12-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2003,
            "month": 1,
            "count": 1302,
            "rate": 7.2,
            "date": "2003-01-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2003,
            "month": 2,
            "count": 1229,
            "rate": 6.7,
            "date": "2003-02-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2003,
            "month": 3,
            "count": 1222,
            "rate": 6.8,
            "date": "2003-03-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2003,
            "month": 4,
            "count": 1199,
            "rate": 6.7,
            "date": "2003-04-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2003,
            "month": 5,
            "count": 1150,
            "rate": 6.5,
            "date": "2003-05-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2003,
            "month": 6,
            "count": 1232,
            "rate": 7,
            "date": "2003-06-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2003,
            "month": 7,
            "count": 1193,
            "rate": 6.9,
            "date": "2003-07-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2003,
            "month": 8,
            "count": 1186,
            "rate": 6.7,
            "date": "2003-08-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2003,
            "month": 9,
            "count": 1175,
            "rate": 6.8,
            "date": "2003-09-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2003,
            "month": 10,
            "count": 1041,
            "rate": 6,
            "date": "2003-10-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2003,
            "month": 11,
            "count": 1034,
            "rate": 5.9,
            "date": "2003-11-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2003,
            "month": 12,
            "count": 1025,
            "rate": 5.9,
            "date": "2003-12-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2004,
            "month": 1,
            "count": 1110,
            "rate": 6.4,
            "date": "2004-01-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2004,
            "month": 2,
            "count": 1094,
            "rate": 6.3,
            "date": "2004-02-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2004,
            "month": 3,
            "count": 1083,
            "rate": 6.3,
            "date": "2004-03-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2004,
            "month": 4,
            "count": 1004,
            "rate": 5.8,
            "date": "2004-04-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2004,
            "month": 5,
            "count": 966,
            "rate": 5.6,
            "date": "2004-05-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2004,
            "month": 6,
            "count": 957,
            "rate": 5.6,
            "date": "2004-06-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2004,
            "month": 7,
            "count": 1019,
            "rate": 6,
            "date": "2004-07-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2004,
            "month": 8,
            "count": 840,
            "rate": 4.9,
            "date": "2004-08-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2004,
            "month": 9,
            "count": 852,
            "rate": 5,
            "date": "2004-09-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2004,
            "month": 10,
            "count": 884,
            "rate": 5.3,
            "date": "2004-10-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2004,
            "month": 11,
            "count": 905,
            "rate": 5.4,
            "date": "2004-11-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2004,
            "month": 12,
            "count": 872,
            "rate": 5.1,
            "date": "2004-12-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2005,
            "month": 1,
            "count": 889,
            "rate": 5.3,
            "date": "2005-01-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2005,
            "month": 2,
            "count": 889,
            "rate": 5.3,
            "date": "2005-02-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2005,
            "month": 3,
            "count": 879,
            "rate": 5.3,
            "date": "2005-03-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2005,
            "month": 4,
            "count": 793,
            "rate": 4.8,
            "date": "2005-04-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2005,
            "month": 5,
            "count": 743,
            "rate": 4.5,
            "date": "2005-05-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2005,
            "month": 6,
            "count": 743,
            "rate": 4.4,
            "date": "2005-06-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2005,
            "month": 7,
            "count": 883,
            "rate": 5.3,
            "date": "2005-07-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2005,
            "month": 8,
            "count": 767,
            "rate": 4.7,
            "date": "2005-08-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2005,
            "month": 9,
            "count": 775,
            "rate": 4.7,
            "date": "2005-09-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2005,
            "month": 10,
            "count": 800,
            "rate": 4.8,
            "date": "2005-10-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2005,
            "month": 11,
            "count": 823,
            "rate": 4.9,
            "date": "2005-11-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2005,
            "month": 12,
            "count": 757,
            "rate": 4.5,
            "date": "2005-12-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2006,
            "month": 1,
            "count": 778,
            "rate": 4.6,
            "date": "2006-01-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2006,
            "month": 2,
            "count": 821,
            "rate": 4.9,
            "date": "2006-02-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2006,
            "month": 3,
            "count": 701,
            "rate": 4.1,
            "date": "2006-03-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2006,
            "month": 4,
            "count": 745,
            "rate": 4.5,
            "date": "2006-04-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2006,
            "month": 5,
            "count": 680,
            "rate": 4.1,
            "date": "2006-05-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2006,
            "month": 6,
            "count": 635,
            "rate": 3.8,
            "date": "2006-06-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2006,
            "month": 7,
            "count": 736,
            "rate": 4.4,
            "date": "2006-07-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2006,
            "month": 8,
            "count": 680,
            "rate": 4.1,
            "date": "2006-08-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2006,
            "month": 9,
            "count": 632,
            "rate": 3.8,
            "date": "2006-09-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2006,
            "month": 10,
            "count": 618,
            "rate": 3.7,
            "date": "2006-10-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2006,
            "month": 11,
            "count": 702,
            "rate": 4.3,
            "date": "2006-11-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2006,
            "month": 12,
            "count": 660,
            "rate": 4,
            "date": "2006-12-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2007,
            "month": 1,
            "count": 752,
            "rate": 4.6,
            "date": "2007-01-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2007,
            "month": 2,
            "count": 774,
            "rate": 4.7,
            "date": "2007-02-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2007,
            "month": 3,
            "count": 742,
            "rate": 4.5,
            "date": "2007-03-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2007,
            "month": 4,
            "count": 749,
            "rate": 4.6,
            "date": "2007-04-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2007,
            "month": 5,
            "count": 651,
            "rate": 3.9,
            "date": "2007-05-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2007,
            "month": 6,
            "count": 653,
            "rate": 4,
            "date": "2007-06-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2007,
            "month": 7,
            "count": 621,
            "rate": 3.7,
            "date": "2007-07-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2007,
            "month": 8,
            "count": 596,
            "rate": 3.6,
            "date": "2007-08-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2007,
            "month": 9,
            "count": 673,
            "rate": 4.1,
            "date": "2007-09-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2007,
            "month": 10,
            "count": 729,
            "rate": 4.3,
            "date": "2007-10-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2007,
            "month": 11,
            "count": 762,
            "rate": 4.5,
            "date": "2007-11-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2007,
            "month": 12,
            "count": 772,
            "rate": 4.6,
            "date": "2007-12-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2008,
            "month": 1,
            "count": 837,
            "rate": 5.1,
            "date": "2008-01-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2008,
            "month": 2,
            "count": 820,
            "rate": 5,
            "date": "2008-02-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2008,
            "month": 3,
            "count": 831,
            "rate": 5,
            "date": "2008-03-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2008,
            "month": 4,
            "count": 796,
            "rate": 4.8,
            "date": "2008-04-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2008,
            "month": 5,
            "count": 879,
            "rate": 5.3,
            "date": "2008-05-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2008,
            "month": 6,
            "count": 862,
            "rate": 5.2,
            "date": "2008-06-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2008,
            "month": 7,
            "count": 908,
            "rate": 5.5,
            "date": "2008-07-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2008,
            "month": 8,
            "count": 960,
            "rate": 5.7,
            "date": "2008-08-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2008,
            "month": 9,
            "count": 984,
            "rate": 6,
            "date": "2008-09-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2008,
            "month": 10,
            "count": 1007,
            "rate": 6.2,
            "date": "2008-10-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2008,
            "month": 11,
            "count": 1144,
            "rate": 7,
            "date": "2008-11-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2008,
            "month": 12,
            "count": 1315,
            "rate": 8.3,
            "date": "2008-12-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2009,
            "month": 1,
            "count": 1711,
            "rate": 10.9,
            "date": "2009-01-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2009,
            "month": 2,
            "count": 1822,
            "rate": 11.5,
            "date": "2009-02-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2009,
            "month": 3,
            "count": 1912,
            "rate": 12.2,
            "date": "2009-03-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2009,
            "month": 4,
            "count": 1968,
            "rate": 12.4,
            "date": "2009-04-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2009,
            "month": 5,
            "count": 2010,
            "rate": 12.6,
            "date": "2009-05-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2009,
            "month": 6,
            "count": 2010,
            "rate": 12.6,
            "date": "2009-06-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2009,
            "month": 7,
            "count": 1988,
            "rate": 12.4,
            "date": "2009-07-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2009,
            "month": 8,
            "count": 1866,
            "rate": 11.8,
            "date": "2009-08-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2009,
            "month": 9,
            "count": 1876,
            "rate": 11.9,
            "date": "2009-09-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2009,
            "month": 10,
            "count": 1884,
            "rate": 12.2,
            "date": "2009-10-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2009,
            "month": 11,
            "count": 1882,
            "rate": 12.5,
            "date": "2009-11-01T07:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2009,
            "month": 12,
            "count": 1747,
            "rate": 11.9,
            "date": "2009-12-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2010,
            "month": 1,
            "count": 1918,
            "rate": 13,
            "date": "2010-01-01T08:00:00.000Z"
         },
         {
            "series": "Manufacturing",
            "year": 2010,
            "month": 2,
            "count": 1814,
            "rate": 12.1,
            "date": "2010-02-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2000,
            "month": 1,
            "count": 1000,
            "rate": 5,
            "date": "2000-01-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2000,
            "month": 2,
            "count": 1023,
            "rate": 5.2,
            "date": "2000-02-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2000,
            "month": 3,
            "count": 983,
            "rate": 5.1,
            "date": "2000-03-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2000,
            "month": 4,
            "count": 793,
            "rate": 4.1,
            "date": "2000-04-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2000,
            "month": 5,
            "count": 821,
            "rate": 4.3,
            "date": "2000-05-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2000,
            "month": 6,
            "count": 837,
            "rate": 4.4,
            "date": "2000-06-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2000,
            "month": 7,
            "count": 792,
            "rate": 4.1,
            "date": "2000-07-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2000,
            "month": 8,
            "count": 853,
            "rate": 4.3,
            "date": "2000-08-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2000,
            "month": 9,
            "count": 791,
            "rate": 4.1,
            "date": "2000-09-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2000,
            "month": 10,
            "count": 739,
            "rate": 3.7,
            "date": "2000-10-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2000,
            "month": 11,
            "count": 701,
            "rate": 3.6,
            "date": "2000-11-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2000,
            "month": 12,
            "count": 715,
            "rate": 3.7,
            "date": "2000-12-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2001,
            "month": 1,
            "count": 908,
            "rate": 4.7,
            "date": "2001-01-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2001,
            "month": 2,
            "count": 990,
            "rate": 5.2,
            "date": "2001-02-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2001,
            "month": 3,
            "count": 1037,
            "rate": 5.4,
            "date": "2001-03-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2001,
            "month": 4,
            "count": 820,
            "rate": 4.3,
            "date": "2001-04-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2001,
            "month": 5,
            "count": 875,
            "rate": 4.5,
            "date": "2001-05-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2001,
            "month": 6,
            "count": 955,
            "rate": 4.9,
            "date": "2001-06-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2001,
            "month": 7,
            "count": 833,
            "rate": 4.3,
            "date": "2001-07-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2001,
            "month": 8,
            "count": 928,
            "rate": 4.8,
            "date": "2001-08-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2001,
            "month": 9,
            "count": 936,
            "rate": 4.8,
            "date": "2001-09-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2001,
            "month": 10,
            "count": 941,
            "rate": 4.8,
            "date": "2001-10-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2001,
            "month": 11,
            "count": 1046,
            "rate": 5.3,
            "date": "2001-11-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2001,
            "month": 12,
            "count": 1074,
            "rate": 5.4,
            "date": "2001-12-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2002,
            "month": 1,
            "count": 1212,
            "rate": 6.3,
            "date": "2002-01-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2002,
            "month": 2,
            "count": 1264,
            "rate": 6.6,
            "date": "2002-02-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2002,
            "month": 3,
            "count": 1269,
            "rate": 6.6,
            "date": "2002-03-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2002,
            "month": 4,
            "count": 1222,
            "rate": 6.4,
            "date": "2002-04-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2002,
            "month": 5,
            "count": 1138,
            "rate": 5.8,
            "date": "2002-05-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2002,
            "month": 6,
            "count": 1240,
            "rate": 6.2,
            "date": "2002-06-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2002,
            "month": 7,
            "count": 1132,
            "rate": 5.6,
            "date": "2002-07-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2002,
            "month": 8,
            "count": 1170,
            "rate": 5.8,
            "date": "2002-08-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2002,
            "month": 9,
            "count": 1171,
            "rate": 5.9,
            "date": "2002-09-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2002,
            "month": 10,
            "count": 1212,
            "rate": 6.1,
            "date": "2002-10-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2002,
            "month": 11,
            "count": 1242,
            "rate": 6.2,
            "date": "2002-11-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2002,
            "month": 12,
            "count": 1150,
            "rate": 5.7,
            "date": "2002-12-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2003,
            "month": 1,
            "count": 1342,
            "rate": 6.7,
            "date": "2003-01-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2003,
            "month": 2,
            "count": 1238,
            "rate": 6.1,
            "date": "2003-02-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2003,
            "month": 3,
            "count": 1179,
            "rate": 5.9,
            "date": "2003-03-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2003,
            "month": 4,
            "count": 1201,
            "rate": 6,
            "date": "2003-04-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2003,
            "month": 5,
            "count": 1247,
            "rate": 6.2,
            "date": "2003-05-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2003,
            "month": 6,
            "count": 1434,
            "rate": 6.9,
            "date": "2003-06-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2003,
            "month": 7,
            "count": 1387,
            "rate": 6.6,
            "date": "2003-07-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2003,
            "month": 8,
            "count": 1161,
            "rate": 5.6,
            "date": "2003-08-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2003,
            "month": 9,
            "count": 1229,
            "rate": 5.9,
            "date": "2003-09-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2003,
            "month": 10,
            "count": 1189,
            "rate": 5.7,
            "date": "2003-10-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2003,
            "month": 11,
            "count": 1156,
            "rate": 5.4,
            "date": "2003-11-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2003,
            "month": 12,
            "count": 1081,
            "rate": 5,
            "date": "2003-12-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2004,
            "month": 1,
            "count": 1389,
            "rate": 6.5,
            "date": "2004-01-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2004,
            "month": 2,
            "count": 1369,
            "rate": 6.5,
            "date": "2004-02-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2004,
            "month": 3,
            "count": 1386,
            "rate": 6.8,
            "date": "2004-03-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2004,
            "month": 4,
            "count": 1248,
            "rate": 6.1,
            "date": "2004-04-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2004,
            "month": 5,
            "count": 1183,
            "rate": 5.8,
            "date": "2004-05-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2004,
            "month": 6,
            "count": 1182,
            "rate": 5.8,
            "date": "2004-06-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2004,
            "month": 7,
            "count": 1163,
            "rate": 5.5,
            "date": "2004-07-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2004,
            "month": 8,
            "count": 1079,
            "rate": 5.1,
            "date": "2004-08-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2004,
            "month": 9,
            "count": 1127,
            "rate": 5.5,
            "date": "2004-09-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2004,
            "month": 10,
            "count": 1138,
            "rate": 5.4,
            "date": "2004-10-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2004,
            "month": 11,
            "count": 1045,
            "rate": 5,
            "date": "2004-11-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2004,
            "month": 12,
            "count": 1058,
            "rate": 5,
            "date": "2004-12-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2005,
            "month": 1,
            "count": 1302,
            "rate": 6.3,
            "date": "2005-01-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2005,
            "month": 2,
            "count": 1301,
            "rate": 6.2,
            "date": "2005-02-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2005,
            "month": 3,
            "count": 1173,
            "rate": 5.6,
            "date": "2005-03-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2005,
            "month": 4,
            "count": 1131,
            "rate": 5.4,
            "date": "2005-04-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2005,
            "month": 5,
            "count": 1145,
            "rate": 5.4,
            "date": "2005-05-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2005,
            "month": 6,
            "count": 1197,
            "rate": 5.7,
            "date": "2005-06-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2005,
            "month": 7,
            "count": 1194,
            "rate": 5.6,
            "date": "2005-07-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2005,
            "month": 8,
            "count": 1130,
            "rate": 5.3,
            "date": "2005-08-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2005,
            "month": 9,
            "count": 1038,
            "rate": 4.9,
            "date": "2005-09-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2005,
            "month": 10,
            "count": 1050,
            "rate": 4.9,
            "date": "2005-10-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2005,
            "month": 11,
            "count": 1013,
            "rate": 4.7,
            "date": "2005-11-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2005,
            "month": 12,
            "count": 968,
            "rate": 4.5,
            "date": "2005-12-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2006,
            "month": 1,
            "count": 1203,
            "rate": 5.7,
            "date": "2006-01-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2006,
            "month": 2,
            "count": 1141,
            "rate": 5.4,
            "date": "2006-02-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2006,
            "month": 3,
            "count": 1022,
            "rate": 4.9,
            "date": "2006-03-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2006,
            "month": 4,
            "count": 972,
            "rate": 4.6,
            "date": "2006-04-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2006,
            "month": 5,
            "count": 1025,
            "rate": 4.8,
            "date": "2006-05-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2006,
            "month": 6,
            "count": 1085,
            "rate": 5.1,
            "date": "2006-06-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2006,
            "month": 7,
            "count": 1083,
            "rate": 5.1,
            "date": "2006-07-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2006,
            "month": 8,
            "count": 977,
            "rate": 4.7,
            "date": "2006-08-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2006,
            "month": 9,
            "count": 1008,
            "rate": 4.9,
            "date": "2006-09-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2006,
            "month": 10,
            "count": 972,
            "rate": 4.7,
            "date": "2006-10-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2006,
            "month": 11,
            "count": 1018,
            "rate": 4.8,
            "date": "2006-11-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2006,
            "month": 12,
            "count": 965,
            "rate": 4.5,
            "date": "2006-12-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2007,
            "month": 1,
            "count": 1166,
            "rate": 5.5,
            "date": "2007-01-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2007,
            "month": 2,
            "count": 1045,
            "rate": 5.1,
            "date": "2007-02-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2007,
            "month": 3,
            "count": 896,
            "rate": 4.4,
            "date": "2007-03-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2007,
            "month": 4,
            "count": 872,
            "rate": 4.2,
            "date": "2007-04-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2007,
            "month": 5,
            "count": 795,
            "rate": 3.9,
            "date": "2007-05-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2007,
            "month": 6,
            "count": 979,
            "rate": 4.6,
            "date": "2007-06-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2007,
            "month": 7,
            "count": 1089,
            "rate": 5.2,
            "date": "2007-07-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2007,
            "month": 8,
            "count": 1028,
            "rate": 5.1,
            "date": "2007-08-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2007,
            "month": 9,
            "count": 1027,
            "rate": 5.1,
            "date": "2007-09-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2007,
            "month": 10,
            "count": 907,
            "rate": 4.4,
            "date": "2007-10-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2007,
            "month": 11,
            "count": 893,
            "rate": 4.3,
            "date": "2007-11-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2007,
            "month": 12,
            "count": 1009,
            "rate": 4.8,
            "date": "2007-12-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2008,
            "month": 1,
            "count": 1120,
            "rate": 5.4,
            "date": "2008-01-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2008,
            "month": 2,
            "count": 1007,
            "rate": 4.9,
            "date": "2008-02-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2008,
            "month": 3,
            "count": 992,
            "rate": 4.9,
            "date": "2008-03-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2008,
            "month": 4,
            "count": 919,
            "rate": 4.5,
            "date": "2008-04-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2008,
            "month": 5,
            "count": 1049,
            "rate": 5.2,
            "date": "2008-05-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2008,
            "month": 6,
            "count": 1160,
            "rate": 5.7,
            "date": "2008-06-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2008,
            "month": 7,
            "count": 1329,
            "rate": 6.5,
            "date": "2008-07-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2008,
            "month": 8,
            "count": 1366,
            "rate": 6.6,
            "date": "2008-08-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2008,
            "month": 9,
            "count": 1277,
            "rate": 6.2,
            "date": "2008-09-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2008,
            "month": 10,
            "count": 1313,
            "rate": 6.3,
            "date": "2008-10-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2008,
            "month": 11,
            "count": 1397,
            "rate": 6.7,
            "date": "2008-11-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2008,
            "month": 12,
            "count": 1535,
            "rate": 7.2,
            "date": "2008-12-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2009,
            "month": 1,
            "count": 1794,
            "rate": 8.7,
            "date": "2009-01-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2009,
            "month": 2,
            "count": 1847,
            "rate": 8.9,
            "date": "2009-02-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2009,
            "month": 3,
            "count": 1852,
            "rate": 9,
            "date": "2009-03-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2009,
            "month": 4,
            "count": 1833,
            "rate": 9,
            "date": "2009-04-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2009,
            "month": 5,
            "count": 1835,
            "rate": 9,
            "date": "2009-05-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2009,
            "month": 6,
            "count": 1863,
            "rate": 9.1,
            "date": "2009-06-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2009,
            "month": 7,
            "count": 1854,
            "rate": 9,
            "date": "2009-07-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2009,
            "month": 8,
            "count": 1794,
            "rate": 8.8,
            "date": "2009-08-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2009,
            "month": 9,
            "count": 1809,
            "rate": 9,
            "date": "2009-09-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2009,
            "month": 10,
            "count": 1919,
            "rate": 9.6,
            "date": "2009-10-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2009,
            "month": 11,
            "count": 1879,
            "rate": 9.2,
            "date": "2009-11-01T07:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2009,
            "month": 12,
            "count": 1851,
            "rate": 9.1,
            "date": "2009-12-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2010,
            "month": 1,
            "count": 2154,
            "rate": 10.5,
            "date": "2010-01-01T08:00:00.000Z"
         },
         {
            "series": "Wholesale and Retail Trade",
            "year": 2010,
            "month": 2,
            "count": 2071,
            "rate": 10,
            "date": "2010-02-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2000,
            "month": 1,
            "count": 236,
            "rate": 4.3,
            "date": "2000-01-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2000,
            "month": 2,
            "count": 223,
            "rate": 4,
            "date": "2000-02-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2000,
            "month": 3,
            "count": 192,
            "rate": 3.5,
            "date": "2000-03-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2000,
            "month": 4,
            "count": 191,
            "rate": 3.4,
            "date": "2000-04-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2000,
            "month": 5,
            "count": 190,
            "rate": 3.4,
            "date": "2000-05-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2000,
            "month": 6,
            "count": 183,
            "rate": 3.2,
            "date": "2000-06-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2000,
            "month": 7,
            "count": 228,
            "rate": 3.9,
            "date": "2000-07-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2000,
            "month": 8,
            "count": 198,
            "rate": 3.4,
            "date": "2000-08-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2000,
            "month": 9,
            "count": 231,
            "rate": 4,
            "date": "2000-09-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2000,
            "month": 10,
            "count": 153,
            "rate": 2.8,
            "date": "2000-10-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2000,
            "month": 11,
            "count": 129,
            "rate": 2.3,
            "date": "2000-11-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2000,
            "month": 12,
            "count": 168,
            "rate": 3.1,
            "date": "2000-12-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2001,
            "month": 1,
            "count": 194,
            "rate": 3.6,
            "date": "2001-01-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2001,
            "month": 2,
            "count": 189,
            "rate": 3.4,
            "date": "2001-02-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2001,
            "month": 3,
            "count": 193,
            "rate": 3.5,
            "date": "2001-03-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2001,
            "month": 4,
            "count": 232,
            "rate": 4.2,
            "date": "2001-04-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2001,
            "month": 5,
            "count": 178,
            "rate": 3.1,
            "date": "2001-05-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2001,
            "month": 6,
            "count": 242,
            "rate": 4.3,
            "date": "2001-06-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2001,
            "month": 7,
            "count": 236,
            "rate": 4.2,
            "date": "2001-07-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2001,
            "month": 8,
            "count": 226,
            "rate": 3.9,
            "date": "2001-08-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2001,
            "month": 9,
            "count": 214,
            "rate": 3.9,
            "date": "2001-09-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2001,
            "month": 10,
            "count": 321,
            "rate": 5.8,
            "date": "2001-10-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2001,
            "month": 11,
            "count": 302,
            "rate": 5.4,
            "date": "2001-11-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2001,
            "month": 12,
            "count": 310,
            "rate": 5.6,
            "date": "2001-12-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2002,
            "month": 1,
            "count": 368,
            "rate": 6.6,
            "date": "2002-01-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2002,
            "month": 2,
            "count": 331,
            "rate": 5.7,
            "date": "2002-02-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2002,
            "month": 3,
            "count": 313,
            "rate": 5.6,
            "date": "2002-03-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2002,
            "month": 4,
            "count": 280,
            "rate": 5,
            "date": "2002-04-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2002,
            "month": 5,
            "count": 257,
            "rate": 4.5,
            "date": "2002-05-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2002,
            "month": 6,
            "count": 274,
            "rate": 4.9,
            "date": "2002-06-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2002,
            "month": 7,
            "count": 270,
            "rate": 4.9,
            "date": "2002-07-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2002,
            "month": 8,
            "count": 221,
            "rate": 3.9,
            "date": "2002-08-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2002,
            "month": 9,
            "count": 235,
            "rate": 4.2,
            "date": "2002-09-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2002,
            "month": 10,
            "count": 262,
            "rate": 4.7,
            "date": "2002-10-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2002,
            "month": 11,
            "count": 233,
            "rate": 4.2,
            "date": "2002-11-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2002,
            "month": 12,
            "count": 243,
            "rate": 4.6,
            "date": "2002-12-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2003,
            "month": 1,
            "count": 331,
            "rate": 6.3,
            "date": "2003-01-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2003,
            "month": 2,
            "count": 316,
            "rate": 5.8,
            "date": "2003-02-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2003,
            "month": 3,
            "count": 319,
            "rate": 5.9,
            "date": "2003-03-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2003,
            "month": 4,
            "count": 274,
            "rate": 5,
            "date": "2003-04-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2003,
            "month": 5,
            "count": 260,
            "rate": 4.9,
            "date": "2003-05-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2003,
            "month": 6,
            "count": 300,
            "rate": 5.5,
            "date": "2003-06-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2003,
            "month": 7,
            "count": 289,
            "rate": 5.4,
            "date": "2003-07-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2003,
            "month": 8,
            "count": 255,
            "rate": 4.8,
            "date": "2003-08-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2003,
            "month": 9,
            "count": 255,
            "rate": 4.7,
            "date": "2003-09-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2003,
            "month": 10,
            "count": 260,
            "rate": 4.8,
            "date": "2003-10-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2003,
            "month": 11,
            "count": 275,
            "rate": 5.1,
            "date": "2003-11-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2003,
            "month": 12,
            "count": 267,
            "rate": 5,
            "date": "2003-12-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2004,
            "month": 1,
            "count": 243,
            "rate": 4.6,
            "date": "2004-01-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2004,
            "month": 2,
            "count": 291,
            "rate": 5.5,
            "date": "2004-02-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2004,
            "month": 3,
            "count": 284,
            "rate": 5.4,
            "date": "2004-03-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2004,
            "month": 4,
            "count": 239,
            "rate": 4.5,
            "date": "2004-04-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2004,
            "month": 5,
            "count": 230,
            "rate": 4.4,
            "date": "2004-05-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2004,
            "month": 6,
            "count": 227,
            "rate": 4.3,
            "date": "2004-06-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2004,
            "month": 7,
            "count": 231,
            "rate": 4.3,
            "date": "2004-07-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2004,
            "month": 8,
            "count": 236,
            "rate": 4.4,
            "date": "2004-08-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2004,
            "month": 9,
            "count": 208,
            "rate": 3.9,
            "date": "2004-09-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2004,
            "month": 10,
            "count": 219,
            "rate": 4,
            "date": "2004-10-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2004,
            "month": 11,
            "count": 217,
            "rate": 4,
            "date": "2004-11-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2004,
            "month": 12,
            "count": 204,
            "rate": 3.8,
            "date": "2004-12-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2005,
            "month": 1,
            "count": 276,
            "rate": 5,
            "date": "2005-01-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2005,
            "month": 2,
            "count": 245,
            "rate": 4.4,
            "date": "2005-02-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2005,
            "month": 3,
            "count": 267,
            "rate": 4.8,
            "date": "2005-03-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2005,
            "month": 4,
            "count": 257,
            "rate": 4.7,
            "date": "2005-04-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2005,
            "month": 5,
            "count": 223,
            "rate": 4.1,
            "date": "2005-05-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2005,
            "month": 6,
            "count": 247,
            "rate": 4.5,
            "date": "2005-06-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2005,
            "month": 7,
            "count": 222,
            "rate": 3.9,
            "date": "2005-07-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2005,
            "month": 8,
            "count": 187,
            "rate": 3.3,
            "date": "2005-08-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2005,
            "month": 9,
            "count": 211,
            "rate": 3.7,
            "date": "2005-09-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2005,
            "month": 10,
            "count": 251,
            "rate": 4.4,
            "date": "2005-10-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2005,
            "month": 11,
            "count": 199,
            "rate": 3.5,
            "date": "2005-11-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2005,
            "month": 12,
            "count": 202,
            "rate": 3.6,
            "date": "2005-12-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2006,
            "month": 1,
            "count": 287,
            "rate": 5,
            "date": "2006-01-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2006,
            "month": 2,
            "count": 260,
            "rate": 4.6,
            "date": "2006-02-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2006,
            "month": 3,
            "count": 263,
            "rate": 4.7,
            "date": "2006-03-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2006,
            "month": 4,
            "count": 272,
            "rate": 4.8,
            "date": "2006-04-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2006,
            "month": 5,
            "count": 226,
            "rate": 4,
            "date": "2006-05-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2006,
            "month": 6,
            "count": 225,
            "rate": 3.9,
            "date": "2006-06-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2006,
            "month": 7,
            "count": 237,
            "rate": 4.2,
            "date": "2006-07-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2006,
            "month": 8,
            "count": 217,
            "rate": 3.7,
            "date": "2006-08-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2006,
            "month": 9,
            "count": 183,
            "rate": 3.1,
            "date": "2006-09-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2006,
            "month": 10,
            "count": 206,
            "rate": 3.6,
            "date": "2006-10-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2006,
            "month": 11,
            "count": 183,
            "rate": 3.1,
            "date": "2006-11-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2006,
            "month": 12,
            "count": 190,
            "rate": 3.2,
            "date": "2006-12-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2007,
            "month": 1,
            "count": 248,
            "rate": 4.2,
            "date": "2007-01-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2007,
            "month": 2,
            "count": 251,
            "rate": 4.2,
            "date": "2007-02-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2007,
            "month": 3,
            "count": 249,
            "rate": 4.3,
            "date": "2007-03-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2007,
            "month": 4,
            "count": 188,
            "rate": 3.3,
            "date": "2007-04-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2007,
            "month": 5,
            "count": 216,
            "rate": 3.8,
            "date": "2007-05-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2007,
            "month": 6,
            "count": 242,
            "rate": 4.1,
            "date": "2007-06-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2007,
            "month": 7,
            "count": 309,
            "rate": 5.1,
            "date": "2007-07-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2007,
            "month": 8,
            "count": 205,
            "rate": 3.4,
            "date": "2007-08-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2007,
            "month": 9,
            "count": 224,
            "rate": 3.7,
            "date": "2007-09-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2007,
            "month": 10,
            "count": 218,
            "rate": 3.6,
            "date": "2007-10-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2007,
            "month": 11,
            "count": 242,
            "rate": 3.9,
            "date": "2007-11-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2007,
            "month": 12,
            "count": 210,
            "rate": 3.4,
            "date": "2007-12-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2008,
            "month": 1,
            "count": 271,
            "rate": 4.4,
            "date": "2008-01-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2008,
            "month": 2,
            "count": 289,
            "rate": 4.6,
            "date": "2008-02-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2008,
            "month": 3,
            "count": 267,
            "rate": 4.3,
            "date": "2008-03-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2008,
            "month": 4,
            "count": 245,
            "rate": 4,
            "date": "2008-04-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2008,
            "month": 5,
            "count": 269,
            "rate": 4.3,
            "date": "2008-05-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2008,
            "month": 6,
            "count": 329,
            "rate": 5.1,
            "date": "2008-06-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2008,
            "month": 7,
            "count": 359,
            "rate": 5.7,
            "date": "2008-07-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2008,
            "month": 8,
            "count": 309,
            "rate": 5.2,
            "date": "2008-08-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2008,
            "month": 9,
            "count": 337,
            "rate": 5.8,
            "date": "2008-09-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2008,
            "month": 10,
            "count": 316,
            "rate": 5.7,
            "date": "2008-10-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2008,
            "month": 11,
            "count": 331,
            "rate": 5.8,
            "date": "2008-11-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2008,
            "month": 12,
            "count": 421,
            "rate": 6.7,
            "date": "2008-12-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2009,
            "month": 1,
            "count": 522,
            "rate": 8.4,
            "date": "2009-01-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2009,
            "month": 2,
            "count": 563,
            "rate": 9.1,
            "date": "2009-02-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2009,
            "month": 3,
            "count": 558,
            "rate": 9,
            "date": "2009-03-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2009,
            "month": 4,
            "count": 541,
            "rate": 9,
            "date": "2009-04-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2009,
            "month": 5,
            "count": 506,
            "rate": 8.5,
            "date": "2009-05-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2009,
            "month": 6,
            "count": 499,
            "rate": 8.4,
            "date": "2009-06-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2009,
            "month": 7,
            "count": 511,
            "rate": 8.8,
            "date": "2009-07-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2009,
            "month": 8,
            "count": 547,
            "rate": 9.8,
            "date": "2009-08-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2009,
            "month": 9,
            "count": 538,
            "rate": 9.5,
            "date": "2009-09-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2009,
            "month": 10,
            "count": 480,
            "rate": 8.6,
            "date": "2009-10-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2009,
            "month": 11,
            "count": 493,
            "rate": 8.5,
            "date": "2009-11-01T07:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2009,
            "month": 12,
            "count": 539,
            "rate": 9,
            "date": "2009-12-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2010,
            "month": 1,
            "count": 657,
            "rate": 11.3,
            "date": "2010-01-01T08:00:00.000Z"
         },
         {
            "series": "Transportation and Utilities",
            "year": 2010,
            "month": 2,
            "count": 591,
            "rate": 10.5,
            "date": "2010-02-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2000,
            "month": 1,
            "count": 125,
            "rate": 3.4,
            "date": "2000-01-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2000,
            "month": 2,
            "count": 112,
            "rate": 2.9,
            "date": "2000-02-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2000,
            "month": 3,
            "count": 140,
            "rate": 3.6,
            "date": "2000-03-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2000,
            "month": 4,
            "count": 95,
            "rate": 2.4,
            "date": "2000-04-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2000,
            "month": 5,
            "count": 131,
            "rate": 3.5,
            "date": "2000-05-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2000,
            "month": 6,
            "count": 102,
            "rate": 2.6,
            "date": "2000-06-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2000,
            "month": 7,
            "count": 144,
            "rate": 3.6,
            "date": "2000-07-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2000,
            "month": 8,
            "count": 143,
            "rate": 3.7,
            "date": "2000-08-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2000,
            "month": 9,
            "count": 130,
            "rate": 3.3,
            "date": "2000-09-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2000,
            "month": 10,
            "count": 96,
            "rate": 2.4,
            "date": "2000-10-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2000,
            "month": 11,
            "count": 117,
            "rate": 3,
            "date": "2000-11-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2000,
            "month": 12,
            "count": 151,
            "rate": 4,
            "date": "2000-12-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2001,
            "month": 1,
            "count": 161,
            "rate": 4.1,
            "date": "2001-01-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2001,
            "month": 2,
            "count": 109,
            "rate": 2.9,
            "date": "2001-02-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2001,
            "month": 3,
            "count": 148,
            "rate": 3.8,
            "date": "2001-03-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2001,
            "month": 4,
            "count": 148,
            "rate": 3.7,
            "date": "2001-04-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2001,
            "month": 5,
            "count": 164,
            "rate": 4.2,
            "date": "2001-05-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2001,
            "month": 6,
            "count": 163,
            "rate": 4.1,
            "date": "2001-06-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2001,
            "month": 7,
            "count": 206,
            "rate": 5.2,
            "date": "2001-07-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2001,
            "month": 8,
            "count": 210,
            "rate": 5.4,
            "date": "2001-08-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2001,
            "month": 9,
            "count": 219,
            "rate": 5.6,
            "date": "2001-09-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2001,
            "month": 10,
            "count": 233,
            "rate": 6,
            "date": "2001-10-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2001,
            "month": 11,
            "count": 241,
            "rate": 6.2,
            "date": "2001-11-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2001,
            "month": 12,
            "count": 275,
            "rate": 7.4,
            "date": "2001-12-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2002,
            "month": 1,
            "count": 263,
            "rate": 7.1,
            "date": "2002-01-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2002,
            "month": 2,
            "count": 279,
            "rate": 7.6,
            "date": "2002-02-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2002,
            "month": 3,
            "count": 266,
            "rate": 7.2,
            "date": "2002-03-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2002,
            "month": 4,
            "count": 257,
            "rate": 6.9,
            "date": "2002-04-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2002,
            "month": 5,
            "count": 260,
            "rate": 7.2,
            "date": "2002-05-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2002,
            "month": 6,
            "count": 255,
            "rate": 6.9,
            "date": "2002-06-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2002,
            "month": 7,
            "count": 264,
            "rate": 7.1,
            "date": "2002-07-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2002,
            "month": 8,
            "count": 270,
            "rate": 7.1,
            "date": "2002-08-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2002,
            "month": 9,
            "count": 231,
            "rate": 6.3,
            "date": "2002-09-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2002,
            "month": 10,
            "count": 211,
            "rate": 6,
            "date": "2002-10-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2002,
            "month": 11,
            "count": 220,
            "rate": 6.5,
            "date": "2002-11-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2002,
            "month": 12,
            "count": 255,
            "rate": 7.2,
            "date": "2002-12-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2003,
            "month": 1,
            "count": 243,
            "rate": 6.7,
            "date": "2003-01-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2003,
            "month": 2,
            "count": 321,
            "rate": 8.6,
            "date": "2003-02-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2003,
            "month": 3,
            "count": 267,
            "rate": 7.4,
            "date": "2003-03-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2003,
            "month": 4,
            "count": 268,
            "rate": 7.3,
            "date": "2003-04-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2003,
            "month": 5,
            "count": 251,
            "rate": 6.9,
            "date": "2003-05-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2003,
            "month": 6,
            "count": 239,
            "rate": 6.4,
            "date": "2003-06-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2003,
            "month": 7,
            "count": 224,
            "rate": 5.9,
            "date": "2003-07-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2003,
            "month": 8,
            "count": 224,
            "rate": 6.1,
            "date": "2003-08-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2003,
            "month": 9,
            "count": 248,
            "rate": 7,
            "date": "2003-09-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2003,
            "month": 10,
            "count": 182,
            "rate": 5.4,
            "date": "2003-10-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2003,
            "month": 11,
            "count": 257,
            "rate": 7.6,
            "date": "2003-11-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2003,
            "month": 12,
            "count": 224,
            "rate": 6.5,
            "date": "2003-12-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2004,
            "month": 1,
            "count": 236,
            "rate": 7,
            "date": "2004-01-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2004,
            "month": 2,
            "count": 194,
            "rate": 5.8,
            "date": "2004-02-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2004,
            "month": 3,
            "count": 216,
            "rate": 6.3,
            "date": "2004-03-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2004,
            "month": 4,
            "count": 168,
            "rate": 5,
            "date": "2004-04-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2004,
            "month": 5,
            "count": 190,
            "rate": 5.7,
            "date": "2004-05-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2004,
            "month": 6,
            "count": 172,
            "rate": 5,
            "date": "2004-06-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2004,
            "month": 7,
            "count": 174,
            "rate": 5.2,
            "date": "2004-07-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2004,
            "month": 8,
            "count": 191,
            "rate": 5.7,
            "date": "2004-08-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2004,
            "month": 9,
            "count": 178,
            "rate": 5.4,
            "date": "2004-09-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2004,
            "month": 10,
            "count": 185,
            "rate": 5.6,
            "date": "2004-10-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2004,
            "month": 11,
            "count": 187,
            "rate": 5.6,
            "date": "2004-11-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2004,
            "month": 12,
            "count": 173,
            "rate": 5.7,
            "date": "2004-12-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2005,
            "month": 1,
            "count": 168,
            "rate": 5.4,
            "date": "2005-01-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2005,
            "month": 2,
            "count": 204,
            "rate": 6.5,
            "date": "2005-02-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2005,
            "month": 3,
            "count": 177,
            "rate": 6,
            "date": "2005-03-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2005,
            "month": 4,
            "count": 178,
            "rate": 5.9,
            "date": "2005-04-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2005,
            "month": 5,
            "count": 145,
            "rate": 4.7,
            "date": "2005-05-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2005,
            "month": 6,
            "count": 160,
            "rate": 5,
            "date": "2005-06-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2005,
            "month": 7,
            "count": 142,
            "rate": 4.2,
            "date": "2005-07-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2005,
            "month": 8,
            "count": 156,
            "rate": 4.6,
            "date": "2005-08-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2005,
            "month": 9,
            "count": 168,
            "rate": 4.9,
            "date": "2005-09-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2005,
            "month": 10,
            "count": 162,
            "rate": 4.8,
            "date": "2005-10-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2005,
            "month": 11,
            "count": 172,
            "rate": 5.1,
            "date": "2005-11-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2005,
            "month": 12,
            "count": 128,
            "rate": 3.7,
            "date": "2005-12-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2006,
            "month": 1,
            "count": 105,
            "rate": 3.3,
            "date": "2006-01-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2006,
            "month": 2,
            "count": 119,
            "rate": 3.7,
            "date": "2006-02-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2006,
            "month": 3,
            "count": 116,
            "rate": 3.5,
            "date": "2006-03-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2006,
            "month": 4,
            "count": 132,
            "rate": 4.2,
            "date": "2006-04-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2006,
            "month": 5,
            "count": 158,
            "rate": 4.8,
            "date": "2006-05-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2006,
            "month": 6,
            "count": 114,
            "rate": 3.4,
            "date": "2006-06-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2006,
            "month": 7,
            "count": 103,
            "rate": 3,
            "date": "2006-07-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2006,
            "month": 8,
            "count": 132,
            "rate": 3.9,
            "date": "2006-08-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2006,
            "month": 9,
            "count": 170,
            "rate": 4.9,
            "date": "2006-09-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2006,
            "month": 10,
            "count": 116,
            "rate": 3.4,
            "date": "2006-10-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2006,
            "month": 11,
            "count": 137,
            "rate": 3.9,
            "date": "2006-11-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2006,
            "month": 12,
            "count": 108,
            "rate": 2.9,
            "date": "2006-12-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2007,
            "month": 1,
            "count": 143,
            "rate": 4,
            "date": "2007-01-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2007,
            "month": 2,
            "count": 139,
            "rate": 4,
            "date": "2007-02-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2007,
            "month": 3,
            "count": 109,
            "rate": 3.2,
            "date": "2007-03-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2007,
            "month": 4,
            "count": 77,
            "rate": 2.4,
            "date": "2007-04-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2007,
            "month": 5,
            "count": 110,
            "rate": 3.3,
            "date": "2007-05-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2007,
            "month": 6,
            "count": 114,
            "rate": 3.4,
            "date": "2007-06-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2007,
            "month": 7,
            "count": 112,
            "rate": 3.4,
            "date": "2007-07-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2007,
            "month": 8,
            "count": 140,
            "rate": 4.1,
            "date": "2007-08-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2007,
            "month": 9,
            "count": 124,
            "rate": 3.7,
            "date": "2007-09-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2007,
            "month": 10,
            "count": 120,
            "rate": 3.7,
            "date": "2007-10-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2007,
            "month": 11,
            "count": 132,
            "rate": 4,
            "date": "2007-11-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2007,
            "month": 12,
            "count": 125,
            "rate": 3.7,
            "date": "2007-12-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2008,
            "month": 1,
            "count": 169,
            "rate": 5.1,
            "date": "2008-01-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2008,
            "month": 2,
            "count": 193,
            "rate": 5.8,
            "date": "2008-02-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2008,
            "month": 3,
            "count": 155,
            "rate": 4.8,
            "date": "2008-03-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2008,
            "month": 4,
            "count": 143,
            "rate": 4.4,
            "date": "2008-04-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2008,
            "month": 5,
            "count": 170,
            "rate": 5,
            "date": "2008-05-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2008,
            "month": 6,
            "count": 157,
            "rate": 4.7,
            "date": "2008-06-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2008,
            "month": 7,
            "count": 141,
            "rate": 4.1,
            "date": "2008-07-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2008,
            "month": 8,
            "count": 144,
            "rate": 4.2,
            "date": "2008-08-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2008,
            "month": 9,
            "count": 166,
            "rate": 5,
            "date": "2008-09-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2008,
            "month": 10,
            "count": 168,
            "rate": 5,
            "date": "2008-10-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2008,
            "month": 11,
            "count": 173,
            "rate": 5.2,
            "date": "2008-11-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2008,
            "month": 12,
            "count": 219,
            "rate": 6.9,
            "date": "2008-12-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2009,
            "month": 1,
            "count": 232,
            "rate": 7.4,
            "date": "2009-01-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2009,
            "month": 2,
            "count": 224,
            "rate": 7.1,
            "date": "2009-02-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2009,
            "month": 3,
            "count": 252,
            "rate": 7.8,
            "date": "2009-03-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2009,
            "month": 4,
            "count": 320,
            "rate": 10.1,
            "date": "2009-04-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2009,
            "month": 5,
            "count": 303,
            "rate": 9.5,
            "date": "2009-05-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2009,
            "month": 6,
            "count": 347,
            "rate": 11.1,
            "date": "2009-06-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2009,
            "month": 7,
            "count": 373,
            "rate": 11.5,
            "date": "2009-07-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2009,
            "month": 8,
            "count": 358,
            "rate": 10.7,
            "date": "2009-08-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2009,
            "month": 9,
            "count": 362,
            "rate": 11.2,
            "date": "2009-09-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2009,
            "month": 10,
            "count": 261,
            "rate": 8.2,
            "date": "2009-10-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2009,
            "month": 11,
            "count": 243,
            "rate": 7.6,
            "date": "2009-11-01T07:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2009,
            "month": 12,
            "count": 256,
            "rate": 8.5,
            "date": "2009-12-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2010,
            "month": 1,
            "count": 313,
            "rate": 10,
            "date": "2010-01-01T08:00:00.000Z"
         },
         {
            "series": "Information",
            "year": 2010,
            "month": 2,
            "count": 300,
            "rate": 10,
            "date": "2010-02-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2000,
            "month": 1,
            "count": 228,
            "rate": 2.7,
            "date": "2000-01-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2000,
            "month": 2,
            "count": 240,
            "rate": 2.8,
            "date": "2000-02-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2000,
            "month": 3,
            "count": 226,
            "rate": 2.6,
            "date": "2000-03-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2000,
            "month": 4,
            "count": 197,
            "rate": 2.3,
            "date": "2000-04-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2000,
            "month": 5,
            "count": 195,
            "rate": 2.2,
            "date": "2000-05-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2000,
            "month": 6,
            "count": 216,
            "rate": 2.5,
            "date": "2000-06-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2000,
            "month": 7,
            "count": 190,
            "rate": 2.2,
            "date": "2000-07-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2000,
            "month": 8,
            "count": 213,
            "rate": 2.5,
            "date": "2000-08-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2000,
            "month": 9,
            "count": 187,
            "rate": 2.2,
            "date": "2000-09-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2000,
            "month": 10,
            "count": 224,
            "rate": 2.6,
            "date": "2000-10-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2000,
            "month": 11,
            "count": 184,
            "rate": 2.1,
            "date": "2000-11-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2000,
            "month": 12,
            "count": 200,
            "rate": 2.3,
            "date": "2000-12-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2001,
            "month": 1,
            "count": 232,
            "rate": 2.6,
            "date": "2001-01-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2001,
            "month": 2,
            "count": 235,
            "rate": 2.6,
            "date": "2001-02-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2001,
            "month": 3,
            "count": 211,
            "rate": 2.4,
            "date": "2001-03-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2001,
            "month": 4,
            "count": 232,
            "rate": 2.6,
            "date": "2001-04-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2001,
            "month": 5,
            "count": 191,
            "rate": 2.2,
            "date": "2001-05-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2001,
            "month": 6,
            "count": 249,
            "rate": 2.8,
            "date": "2001-06-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2001,
            "month": 7,
            "count": 289,
            "rate": 3.3,
            "date": "2001-07-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2001,
            "month": 8,
            "count": 256,
            "rate": 2.9,
            "date": "2001-08-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2001,
            "month": 9,
            "count": 268,
            "rate": 3.1,
            "date": "2001-09-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2001,
            "month": 10,
            "count": 281,
            "rate": 3.3,
            "date": "2001-10-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2001,
            "month": 11,
            "count": 320,
            "rate": 3.6,
            "date": "2001-11-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2001,
            "month": 12,
            "count": 258,
            "rate": 3,
            "date": "2001-12-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2002,
            "month": 1,
            "count": 267,
            "rate": 3,
            "date": "2002-01-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2002,
            "month": 2,
            "count": 318,
            "rate": 3.5,
            "date": "2002-02-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2002,
            "month": 3,
            "count": 287,
            "rate": 3.2,
            "date": "2002-03-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2002,
            "month": 4,
            "count": 292,
            "rate": 3.3,
            "date": "2002-04-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2002,
            "month": 5,
            "count": 340,
            "rate": 3.8,
            "date": "2002-05-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2002,
            "month": 6,
            "count": 373,
            "rate": 4.1,
            "date": "2002-06-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2002,
            "month": 7,
            "count": 345,
            "rate": 3.8,
            "date": "2002-07-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2002,
            "month": 8,
            "count": 343,
            "rate": 3.8,
            "date": "2002-08-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2002,
            "month": 9,
            "count": 299,
            "rate": 3.3,
            "date": "2002-09-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2002,
            "month": 10,
            "count": 312,
            "rate": 3.5,
            "date": "2002-10-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2002,
            "month": 11,
            "count": 337,
            "rate": 3.7,
            "date": "2002-11-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2002,
            "month": 12,
            "count": 322,
            "rate": 3.6,
            "date": "2002-12-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2003,
            "month": 1,
            "count": 327,
            "rate": 3.6,
            "date": "2003-01-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2003,
            "month": 2,
            "count": 310,
            "rate": 3.4,
            "date": "2003-02-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2003,
            "month": 3,
            "count": 357,
            "rate": 4,
            "date": "2003-03-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2003,
            "month": 4,
            "count": 323,
            "rate": 3.6,
            "date": "2003-04-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2003,
            "month": 5,
            "count": 320,
            "rate": 3.6,
            "date": "2003-05-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2003,
            "month": 6,
            "count": 358,
            "rate": 4,
            "date": "2003-06-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2003,
            "month": 7,
            "count": 284,
            "rate": 3.1,
            "date": "2003-07-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2003,
            "month": 8,
            "count": 342,
            "rate": 3.7,
            "date": "2003-08-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2003,
            "month": 9,
            "count": 305,
            "rate": 3.3,
            "date": "2003-09-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2003,
            "month": 10,
            "count": 303,
            "rate": 3.3,
            "date": "2003-10-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2003,
            "month": 11,
            "count": 311,
            "rate": 3.3,
            "date": "2003-11-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2003,
            "month": 12,
            "count": 283,
            "rate": 3,
            "date": "2003-12-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2004,
            "month": 1,
            "count": 403,
            "rate": 4.3,
            "date": "2004-01-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2004,
            "month": 2,
            "count": 363,
            "rate": 3.8,
            "date": "2004-02-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2004,
            "month": 3,
            "count": 343,
            "rate": 3.7,
            "date": "2004-03-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2004,
            "month": 4,
            "count": 312,
            "rate": 3.4,
            "date": "2004-04-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2004,
            "month": 5,
            "count": 302,
            "rate": 3.3,
            "date": "2004-05-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2004,
            "month": 6,
            "count": 335,
            "rate": 3.6,
            "date": "2004-06-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2004,
            "month": 7,
            "count": 307,
            "rate": 3.3,
            "date": "2004-07-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2004,
            "month": 8,
            "count": 312,
            "rate": 3.4,
            "date": "2004-08-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2004,
            "month": 9,
            "count": 374,
            "rate": 4,
            "date": "2004-09-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2004,
            "month": 10,
            "count": 358,
            "rate": 3.8,
            "date": "2004-10-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2004,
            "month": 11,
            "count": 290,
            "rate": 3.1,
            "date": "2004-11-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2004,
            "month": 12,
            "count": 290,
            "rate": 3.1,
            "date": "2004-12-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2005,
            "month": 1,
            "count": 252,
            "rate": 2.7,
            "date": "2005-01-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2005,
            "month": 2,
            "count": 301,
            "rate": 3.2,
            "date": "2005-02-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2005,
            "month": 3,
            "count": 261,
            "rate": 2.7,
            "date": "2005-03-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2005,
            "month": 4,
            "count": 255,
            "rate": 2.7,
            "date": "2005-04-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2005,
            "month": 5,
            "count": 288,
            "rate": 3.1,
            "date": "2005-05-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2005,
            "month": 6,
            "count": 307,
            "rate": 3.3,
            "date": "2005-06-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2005,
            "month": 7,
            "count": 309,
            "rate": 3.3,
            "date": "2005-07-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2005,
            "month": 8,
            "count": 300,
            "rate": 3.2,
            "date": "2005-08-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2005,
            "month": 9,
            "count": 260,
            "rate": 2.7,
            "date": "2005-09-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2005,
            "month": 10,
            "count": 255,
            "rate": 2.7,
            "date": "2005-10-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2005,
            "month": 11,
            "count": 268,
            "rate": 2.8,
            "date": "2005-11-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2005,
            "month": 12,
            "count": 204,
            "rate": 2.1,
            "date": "2005-12-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2006,
            "month": 1,
            "count": 233,
            "rate": 2.4,
            "date": "2006-01-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2006,
            "month": 2,
            "count": 268,
            "rate": 2.8,
            "date": "2006-02-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2006,
            "month": 3,
            "count": 298,
            "rate": 3.1,
            "date": "2006-03-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2006,
            "month": 4,
            "count": 293,
            "rate": 3.1,
            "date": "2006-04-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2006,
            "month": 5,
            "count": 289,
            "rate": 3,
            "date": "2006-05-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2006,
            "month": 6,
            "count": 299,
            "rate": 3.1,
            "date": "2006-06-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2006,
            "month": 7,
            "count": 329,
            "rate": 3.4,
            "date": "2006-07-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2006,
            "month": 8,
            "count": 263,
            "rate": 2.7,
            "date": "2006-08-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2006,
            "month": 9,
            "count": 235,
            "rate": 2.4,
            "date": "2006-09-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2006,
            "month": 10,
            "count": 211,
            "rate": 2.1,
            "date": "2006-10-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2006,
            "month": 11,
            "count": 229,
            "rate": 2.3,
            "date": "2006-11-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2006,
            "month": 12,
            "count": 227,
            "rate": 2.3,
            "date": "2006-12-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2007,
            "month": 1,
            "count": 233,
            "rate": 2.4,
            "date": "2007-01-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2007,
            "month": 2,
            "count": 295,
            "rate": 3.1,
            "date": "2007-02-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2007,
            "month": 3,
            "count": 252,
            "rate": 2.6,
            "date": "2007-03-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2007,
            "month": 4,
            "count": 231,
            "rate": 2.4,
            "date": "2007-04-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2007,
            "month": 5,
            "count": 281,
            "rate": 2.9,
            "date": "2007-05-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2007,
            "month": 6,
            "count": 303,
            "rate": 3.1,
            "date": "2007-06-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2007,
            "month": 7,
            "count": 307,
            "rate": 3.1,
            "date": "2007-07-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2007,
            "month": 8,
            "count": 371,
            "rate": 3.7,
            "date": "2007-08-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2007,
            "month": 9,
            "count": 316,
            "rate": 3.3,
            "date": "2007-09-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2007,
            "month": 10,
            "count": 307,
            "rate": 3.2,
            "date": "2007-10-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2007,
            "month": 11,
            "count": 261,
            "rate": 2.7,
            "date": "2007-11-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2007,
            "month": 12,
            "count": 315,
            "rate": 3.2,
            "date": "2007-12-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2008,
            "month": 1,
            "count": 285,
            "rate": 3,
            "date": "2008-01-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2008,
            "month": 2,
            "count": 323,
            "rate": 3.4,
            "date": "2008-02-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2008,
            "month": 3,
            "count": 323,
            "rate": 3.4,
            "date": "2008-03-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2008,
            "month": 4,
            "count": 324,
            "rate": 3.4,
            "date": "2008-04-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2008,
            "month": 5,
            "count": 361,
            "rate": 3.7,
            "date": "2008-05-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2008,
            "month": 6,
            "count": 337,
            "rate": 3.4,
            "date": "2008-06-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2008,
            "month": 7,
            "count": 350,
            "rate": 3.6,
            "date": "2008-07-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2008,
            "month": 8,
            "count": 409,
            "rate": 4.2,
            "date": "2008-08-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2008,
            "month": 9,
            "count": 380,
            "rate": 4,
            "date": "2008-09-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2008,
            "month": 10,
            "count": 434,
            "rate": 4.5,
            "date": "2008-10-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2008,
            "month": 11,
            "count": 494,
            "rate": 5.2,
            "date": "2008-11-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2008,
            "month": 12,
            "count": 540,
            "rate": 5.6,
            "date": "2008-12-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2009,
            "month": 1,
            "count": 571,
            "rate": 6,
            "date": "2009-01-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2009,
            "month": 2,
            "count": 637,
            "rate": 6.7,
            "date": "2009-02-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2009,
            "month": 3,
            "count": 639,
            "rate": 6.8,
            "date": "2009-03-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2009,
            "month": 4,
            "count": 561,
            "rate": 6,
            "date": "2009-04-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2009,
            "month": 5,
            "count": 536,
            "rate": 5.7,
            "date": "2009-05-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2009,
            "month": 6,
            "count": 513,
            "rate": 5.5,
            "date": "2009-06-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2009,
            "month": 7,
            "count": 570,
            "rate": 6.1,
            "date": "2009-07-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2009,
            "month": 8,
            "count": 566,
            "rate": 6,
            "date": "2009-08-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2009,
            "month": 9,
            "count": 657,
            "rate": 7.1,
            "date": "2009-09-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2009,
            "month": 10,
            "count": 646,
            "rate": 7,
            "date": "2009-10-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2009,
            "month": 11,
            "count": 619,
            "rate": 6.7,
            "date": "2009-11-01T07:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2009,
            "month": 12,
            "count": 665,
            "rate": 7.2,
            "date": "2009-12-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2010,
            "month": 1,
            "count": 623,
            "rate": 6.6,
            "date": "2010-01-01T08:00:00.000Z"
         },
         {
            "series": "Finance",
            "year": 2010,
            "month": 2,
            "count": 708,
            "rate": 7.5,
            "date": "2010-02-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2000,
            "month": 1,
            "count": 655,
            "rate": 5.7,
            "date": "2000-01-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2000,
            "month": 2,
            "count": 587,
            "rate": 5.2,
            "date": "2000-02-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2000,
            "month": 3,
            "count": 623,
            "rate": 5.4,
            "date": "2000-03-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2000,
            "month": 4,
            "count": 517,
            "rate": 4.5,
            "date": "2000-04-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2000,
            "month": 5,
            "count": 561,
            "rate": 4.7,
            "date": "2000-05-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2000,
            "month": 6,
            "count": 545,
            "rate": 4.4,
            "date": "2000-06-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2000,
            "month": 7,
            "count": 636,
            "rate": 5.1,
            "date": "2000-07-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2000,
            "month": 8,
            "count": 584,
            "rate": 4.8,
            "date": "2000-08-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2000,
            "month": 9,
            "count": 559,
            "rate": 4.6,
            "date": "2000-09-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2000,
            "month": 10,
            "count": 504,
            "rate": 4.1,
            "date": "2000-10-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2000,
            "month": 11,
            "count": 547,
            "rate": 4.4,
            "date": "2000-11-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2000,
            "month": 12,
            "count": 564,
            "rate": 4.5,
            "date": "2000-12-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2001,
            "month": 1,
            "count": 734,
            "rate": 5.8,
            "date": "2001-01-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2001,
            "month": 2,
            "count": 724,
            "rate": 5.9,
            "date": "2001-02-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2001,
            "month": 3,
            "count": 652,
            "rate": 5.3,
            "date": "2001-03-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2001,
            "month": 4,
            "count": 655,
            "rate": 5.3,
            "date": "2001-04-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2001,
            "month": 5,
            "count": 652,
            "rate": 5.3,
            "date": "2001-05-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2001,
            "month": 6,
            "count": 694,
            "rate": 5.4,
            "date": "2001-06-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2001,
            "month": 7,
            "count": 731,
            "rate": 5.7,
            "date": "2001-07-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2001,
            "month": 8,
            "count": 790,
            "rate": 6.2,
            "date": "2001-08-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2001,
            "month": 9,
            "count": 810,
            "rate": 6.4,
            "date": "2001-09-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2001,
            "month": 10,
            "count": 910,
            "rate": 7.2,
            "date": "2001-10-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2001,
            "month": 11,
            "count": 946,
            "rate": 7.6,
            "date": "2001-11-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2001,
            "month": 12,
            "count": 921,
            "rate": 7.4,
            "date": "2001-12-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2002,
            "month": 1,
            "count": 1120,
            "rate": 8.9,
            "date": "2002-01-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2002,
            "month": 2,
            "count": 973,
            "rate": 7.7,
            "date": "2002-02-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2002,
            "month": 3,
            "count": 964,
            "rate": 7.5,
            "date": "2002-03-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2002,
            "month": 4,
            "count": 951,
            "rate": 7.3,
            "date": "2002-04-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2002,
            "month": 5,
            "count": 983,
            "rate": 7.7,
            "date": "2002-05-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2002,
            "month": 6,
            "count": 1079,
            "rate": 8.2,
            "date": "2002-06-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2002,
            "month": 7,
            "count": 1075,
            "rate": 8.2,
            "date": "2002-07-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2002,
            "month": 8,
            "count": 926,
            "rate": 7.2,
            "date": "2002-08-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2002,
            "month": 9,
            "count": 1007,
            "rate": 7.8,
            "date": "2002-09-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2002,
            "month": 10,
            "count": 962,
            "rate": 7.5,
            "date": "2002-10-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2002,
            "month": 11,
            "count": 1029,
            "rate": 8.2,
            "date": "2002-11-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2002,
            "month": 12,
            "count": 1038,
            "rate": 8.3,
            "date": "2002-12-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2003,
            "month": 1,
            "count": 1112,
            "rate": 8.9,
            "date": "2003-01-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2003,
            "month": 2,
            "count": 1140,
            "rate": 8.9,
            "date": "2003-02-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2003,
            "month": 3,
            "count": 1190,
            "rate": 9.1,
            "date": "2003-03-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2003,
            "month": 4,
            "count": 1076,
            "rate": 8.3,
            "date": "2003-04-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2003,
            "month": 5,
            "count": 1105,
            "rate": 8.4,
            "date": "2003-05-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2003,
            "month": 6,
            "count": 1092,
            "rate": 8.5,
            "date": "2003-06-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2003,
            "month": 7,
            "count": 1021,
            "rate": 8.2,
            "date": "2003-07-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2003,
            "month": 8,
            "count": 881,
            "rate": 7.2,
            "date": "2003-08-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2003,
            "month": 9,
            "count": 975,
            "rate": 8,
            "date": "2003-09-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2003,
            "month": 10,
            "count": 1014,
            "rate": 8.1,
            "date": "2003-10-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2003,
            "month": 11,
            "count": 948,
            "rate": 7.7,
            "date": "2003-11-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2003,
            "month": 12,
            "count": 948,
            "rate": 7.6,
            "date": "2003-12-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2004,
            "month": 1,
            "count": 1070,
            "rate": 8.7,
            "date": "2004-01-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2004,
            "month": 2,
            "count": 964,
            "rate": 7.7,
            "date": "2004-02-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2004,
            "month": 3,
            "count": 999,
            "rate": 7.9,
            "date": "2004-03-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2004,
            "month": 4,
            "count": 752,
            "rate": 6,
            "date": "2004-04-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2004,
            "month": 5,
            "count": 819,
            "rate": 6.5,
            "date": "2004-05-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2004,
            "month": 6,
            "count": 814,
            "rate": 6.5,
            "date": "2004-06-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2004,
            "month": 7,
            "count": 790,
            "rate": 6.2,
            "date": "2004-07-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2004,
            "month": 8,
            "count": 845,
            "rate": 6.7,
            "date": "2004-08-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2004,
            "month": 9,
            "count": 750,
            "rate": 5.9,
            "date": "2004-09-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2004,
            "month": 10,
            "count": 781,
            "rate": 6.2,
            "date": "2004-10-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2004,
            "month": 11,
            "count": 872,
            "rate": 6.8,
            "date": "2004-11-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2004,
            "month": 12,
            "count": 875,
            "rate": 6.9,
            "date": "2004-12-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2005,
            "month": 1,
            "count": 958,
            "rate": 7.6,
            "date": "2005-01-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2005,
            "month": 2,
            "count": 916,
            "rate": 7.2,
            "date": "2005-02-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2005,
            "month": 3,
            "count": 807,
            "rate": 6.5,
            "date": "2005-03-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2005,
            "month": 4,
            "count": 714,
            "rate": 5.7,
            "date": "2005-04-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2005,
            "month": 5,
            "count": 730,
            "rate": 5.9,
            "date": "2005-05-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2005,
            "month": 6,
            "count": 743,
            "rate": 5.8,
            "date": "2005-06-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2005,
            "month": 7,
            "count": 804,
            "rate": 6.3,
            "date": "2005-07-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2005,
            "month": 8,
            "count": 728,
            "rate": 5.7,
            "date": "2005-08-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2005,
            "month": 9,
            "count": 862,
            "rate": 6.7,
            "date": "2005-09-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2005,
            "month": 10,
            "count": 748,
            "rate": 5.8,
            "date": "2005-10-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2005,
            "month": 11,
            "count": 711,
            "rate": 5.5,
            "date": "2005-11-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2005,
            "month": 12,
            "count": 788,
            "rate": 6.1,
            "date": "2005-12-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2006,
            "month": 1,
            "count": 825,
            "rate": 6.5,
            "date": "2006-01-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2006,
            "month": 2,
            "count": 841,
            "rate": 6.5,
            "date": "2006-02-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2006,
            "month": 3,
            "count": 824,
            "rate": 6.3,
            "date": "2006-03-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2006,
            "month": 4,
            "count": 644,
            "rate": 4.9,
            "date": "2006-04-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2006,
            "month": 5,
            "count": 695,
            "rate": 5.3,
            "date": "2006-05-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2006,
            "month": 6,
            "count": 753,
            "rate": 5.7,
            "date": "2006-06-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2006,
            "month": 7,
            "count": 735,
            "rate": 5.5,
            "date": "2006-07-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2006,
            "month": 8,
            "count": 681,
            "rate": 5.1,
            "date": "2006-08-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2006,
            "month": 9,
            "count": 736,
            "rate": 5.6,
            "date": "2006-09-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2006,
            "month": 10,
            "count": 768,
            "rate": 5.6,
            "date": "2006-10-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2006,
            "month": 11,
            "count": 658,
            "rate": 4.9,
            "date": "2006-11-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2006,
            "month": 12,
            "count": 791,
            "rate": 5.9,
            "date": "2006-12-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2007,
            "month": 1,
            "count": 885,
            "rate": 6.5,
            "date": "2007-01-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2007,
            "month": 2,
            "count": 825,
            "rate": 6,
            "date": "2007-02-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2007,
            "month": 3,
            "count": 775,
            "rate": 5.7,
            "date": "2007-03-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2007,
            "month": 4,
            "count": 689,
            "rate": 5,
            "date": "2007-04-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2007,
            "month": 5,
            "count": 743,
            "rate": 5.4,
            "date": "2007-05-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2007,
            "month": 6,
            "count": 722,
            "rate": 5.2,
            "date": "2007-06-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2007,
            "month": 7,
            "count": 743,
            "rate": 5.2,
            "date": "2007-07-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2007,
            "month": 8,
            "count": 683,
            "rate": 4.9,
            "date": "2007-08-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2007,
            "month": 9,
            "count": 655,
            "rate": 4.7,
            "date": "2007-09-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2007,
            "month": 10,
            "count": 675,
            "rate": 4.8,
            "date": "2007-10-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2007,
            "month": 11,
            "count": 679,
            "rate": 4.8,
            "date": "2007-11-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2007,
            "month": 12,
            "count": 803,
            "rate": 5.7,
            "date": "2007-12-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2008,
            "month": 1,
            "count": 893,
            "rate": 6.4,
            "date": "2008-01-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2008,
            "month": 2,
            "count": 866,
            "rate": 6.2,
            "date": "2008-02-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2008,
            "month": 3,
            "count": 876,
            "rate": 6.2,
            "date": "2008-03-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2008,
            "month": 4,
            "count": 736,
            "rate": 5.3,
            "date": "2008-04-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2008,
            "month": 5,
            "count": 829,
            "rate": 5.9,
            "date": "2008-05-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2008,
            "month": 6,
            "count": 890,
            "rate": 6.2,
            "date": "2008-06-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2008,
            "month": 7,
            "count": 866,
            "rate": 6.1,
            "date": "2008-07-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2008,
            "month": 8,
            "count": 961,
            "rate": 6.9,
            "date": "2008-08-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2008,
            "month": 9,
            "count": 951,
            "rate": 6.9,
            "date": "2008-09-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2008,
            "month": 10,
            "count": 1052,
            "rate": 7.5,
            "date": "2008-10-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2008,
            "month": 11,
            "count": 992,
            "rate": 7,
            "date": "2008-11-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2008,
            "month": 12,
            "count": 1147,
            "rate": 8.1,
            "date": "2008-12-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2009,
            "month": 1,
            "count": 1445,
            "rate": 10.4,
            "date": "2009-01-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2009,
            "month": 2,
            "count": 1512,
            "rate": 10.8,
            "date": "2009-02-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2009,
            "month": 3,
            "count": 1597,
            "rate": 11.4,
            "date": "2009-03-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2009,
            "month": 4,
            "count": 1448,
            "rate": 10.4,
            "date": "2009-04-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2009,
            "month": 5,
            "count": 1514,
            "rate": 10.9,
            "date": "2009-05-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2009,
            "month": 6,
            "count": 1580,
            "rate": 11.3,
            "date": "2009-06-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2009,
            "month": 7,
            "count": 1531,
            "rate": 10.9,
            "date": "2009-07-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2009,
            "month": 8,
            "count": 1560,
            "rate": 11,
            "date": "2009-08-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2009,
            "month": 9,
            "count": 1596,
            "rate": 11.3,
            "date": "2009-09-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2009,
            "month": 10,
            "count": 1488,
            "rate": 10.3,
            "date": "2009-10-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2009,
            "month": 11,
            "count": 1514,
            "rate": 10.6,
            "date": "2009-11-01T07:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2009,
            "month": 12,
            "count": 1486,
            "rate": 10.3,
            "date": "2009-12-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2010,
            "month": 1,
            "count": 1614,
            "rate": 11.1,
            "date": "2010-01-01T08:00:00.000Z"
         },
         {
            "series": "Business services",
            "year": 2010,
            "month": 2,
            "count": 1740,
            "rate": 12,
            "date": "2010-02-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2000,
            "month": 1,
            "count": 353,
            "rate": 2.3,
            "date": "2000-01-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2000,
            "month": 2,
            "count": 349,
            "rate": 2.2,
            "date": "2000-02-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2000,
            "month": 3,
            "count": 381,
            "rate": 2.5,
            "date": "2000-03-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2000,
            "month": 4,
            "count": 329,
            "rate": 2.1,
            "date": "2000-04-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2000,
            "month": 5,
            "count": 423,
            "rate": 2.7,
            "date": "2000-05-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2000,
            "month": 6,
            "count": 452,
            "rate": 2.9,
            "date": "2000-06-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2000,
            "month": 7,
            "count": 478,
            "rate": 3.1,
            "date": "2000-07-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2000,
            "month": 8,
            "count": 450,
            "rate": 2.9,
            "date": "2000-08-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2000,
            "month": 9,
            "count": 398,
            "rate": 2.6,
            "date": "2000-09-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2000,
            "month": 10,
            "count": 339,
            "rate": 2.1,
            "date": "2000-10-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2000,
            "month": 11,
            "count": 351,
            "rate": 2.2,
            "date": "2000-11-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2000,
            "month": 12,
            "count": 293,
            "rate": 1.8,
            "date": "2000-12-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2001,
            "month": 1,
            "count": 428,
            "rate": 2.6,
            "date": "2001-01-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2001,
            "month": 2,
            "count": 423,
            "rate": 2.6,
            "date": "2001-02-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2001,
            "month": 3,
            "count": 456,
            "rate": 2.8,
            "date": "2001-03-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2001,
            "month": 4,
            "count": 341,
            "rate": 2.1,
            "date": "2001-04-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2001,
            "month": 5,
            "count": 390,
            "rate": 2.4,
            "date": "2001-05-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2001,
            "month": 6,
            "count": 476,
            "rate": 3,
            "date": "2001-06-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2001,
            "month": 7,
            "count": 513,
            "rate": 3.1,
            "date": "2001-07-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2001,
            "month": 8,
            "count": 595,
            "rate": 3.7,
            "date": "2001-08-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2001,
            "month": 9,
            "count": 455,
            "rate": 2.8,
            "date": "2001-09-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2001,
            "month": 10,
            "count": 486,
            "rate": 2.9,
            "date": "2001-10-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2001,
            "month": 11,
            "count": 516,
            "rate": 3.1,
            "date": "2001-11-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2001,
            "month": 12,
            "count": 483,
            "rate": 2.9,
            "date": "2001-12-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2002,
            "month": 1,
            "count": 586,
            "rate": 3.5,
            "date": "2002-01-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2002,
            "month": 2,
            "count": 590,
            "rate": 3.5,
            "date": "2002-02-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2002,
            "month": 3,
            "count": 540,
            "rate": 3.2,
            "date": "2002-03-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2002,
            "month": 4,
            "count": 493,
            "rate": 2.9,
            "date": "2002-04-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2002,
            "month": 5,
            "count": 533,
            "rate": 3.2,
            "date": "2002-05-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2002,
            "month": 6,
            "count": 638,
            "rate": 3.9,
            "date": "2002-06-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2002,
            "month": 7,
            "count": 671,
            "rate": 4,
            "date": "2002-07-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2002,
            "month": 8,
            "count": 660,
            "rate": 3.9,
            "date": "2002-08-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2002,
            "month": 9,
            "count": 562,
            "rate": 3.2,
            "date": "2002-09-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2002,
            "month": 10,
            "count": 517,
            "rate": 3,
            "date": "2002-10-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2002,
            "month": 11,
            "count": 493,
            "rate": 2.8,
            "date": "2002-11-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2002,
            "month": 12,
            "count": 558,
            "rate": 3.2,
            "date": "2002-12-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2003,
            "month": 1,
            "count": 559,
            "rate": 3.2,
            "date": "2003-01-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2003,
            "month": 2,
            "count": 576,
            "rate": 3.2,
            "date": "2003-02-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2003,
            "month": 3,
            "count": 518,
            "rate": 2.9,
            "date": "2003-03-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2003,
            "month": 4,
            "count": 611,
            "rate": 3.4,
            "date": "2003-04-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2003,
            "month": 5,
            "count": 618,
            "rate": 3.5,
            "date": "2003-05-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2003,
            "month": 6,
            "count": 769,
            "rate": 4.4,
            "date": "2003-06-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2003,
            "month": 7,
            "count": 697,
            "rate": 4,
            "date": "2003-07-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2003,
            "month": 8,
            "count": 760,
            "rate": 4.3,
            "date": "2003-08-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2003,
            "month": 9,
            "count": 649,
            "rate": 3.7,
            "date": "2003-09-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2003,
            "month": 10,
            "count": 639,
            "rate": 3.6,
            "date": "2003-10-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2003,
            "month": 11,
            "count": 662,
            "rate": 3.8,
            "date": "2003-11-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2003,
            "month": 12,
            "count": 620,
            "rate": 3.5,
            "date": "2003-12-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2004,
            "month": 1,
            "count": 662,
            "rate": 3.7,
            "date": "2004-01-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2004,
            "month": 2,
            "count": 608,
            "rate": 3.4,
            "date": "2004-02-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2004,
            "month": 3,
            "count": 584,
            "rate": 3.2,
            "date": "2004-03-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2004,
            "month": 4,
            "count": 589,
            "rate": 3.3,
            "date": "2004-04-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2004,
            "month": 5,
            "count": 570,
            "rate": 3.2,
            "date": "2004-05-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2004,
            "month": 6,
            "count": 769,
            "rate": 4.2,
            "date": "2004-06-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2004,
            "month": 7,
            "count": 725,
            "rate": 4,
            "date": "2004-07-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2004,
            "month": 8,
            "count": 647,
            "rate": 3.7,
            "date": "2004-08-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2004,
            "month": 9,
            "count": 593,
            "rate": 3.3,
            "date": "2004-09-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2004,
            "month": 10,
            "count": 526,
            "rate": 2.9,
            "date": "2004-10-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2004,
            "month": 11,
            "count": 570,
            "rate": 3.2,
            "date": "2004-11-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2004,
            "month": 12,
            "count": 562,
            "rate": 3.1,
            "date": "2004-12-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2005,
            "month": 1,
            "count": 613,
            "rate": 3.4,
            "date": "2005-01-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2005,
            "month": 2,
            "count": 619,
            "rate": 3.4,
            "date": "2005-02-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2005,
            "month": 3,
            "count": 614,
            "rate": 3.4,
            "date": "2005-03-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2005,
            "month": 4,
            "count": 591,
            "rate": 3.3,
            "date": "2005-04-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2005,
            "month": 5,
            "count": 648,
            "rate": 3.6,
            "date": "2005-05-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2005,
            "month": 6,
            "count": 667,
            "rate": 3.6,
            "date": "2005-06-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2005,
            "month": 7,
            "count": 635,
            "rate": 3.5,
            "date": "2005-07-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2005,
            "month": 8,
            "count": 644,
            "rate": 3.5,
            "date": "2005-08-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2005,
            "month": 9,
            "count": 658,
            "rate": 3.5,
            "date": "2005-09-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2005,
            "month": 10,
            "count": 628,
            "rate": 3.4,
            "date": "2005-10-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2005,
            "month": 11,
            "count": 677,
            "rate": 3.6,
            "date": "2005-11-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2005,
            "month": 12,
            "count": 529,
            "rate": 2.8,
            "date": "2005-12-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2006,
            "month": 1,
            "count": 593,
            "rate": 3.2,
            "date": "2006-01-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2006,
            "month": 2,
            "count": 528,
            "rate": 2.8,
            "date": "2006-02-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2006,
            "month": 3,
            "count": 563,
            "rate": 3,
            "date": "2006-03-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2006,
            "month": 4,
            "count": 558,
            "rate": 3,
            "date": "2006-04-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2006,
            "month": 5,
            "count": 543,
            "rate": 2.9,
            "date": "2006-05-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2006,
            "month": 6,
            "count": 617,
            "rate": 3.3,
            "date": "2006-06-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2006,
            "month": 7,
            "count": 659,
            "rate": 3.5,
            "date": "2006-07-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2006,
            "month": 8,
            "count": 611,
            "rate": 3.2,
            "date": "2006-08-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2006,
            "month": 9,
            "count": 576,
            "rate": 3,
            "date": "2006-09-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2006,
            "month": 10,
            "count": 531,
            "rate": 2.8,
            "date": "2006-10-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2006,
            "month": 11,
            "count": 536,
            "rate": 2.8,
            "date": "2006-11-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2006,
            "month": 12,
            "count": 502,
            "rate": 2.6,
            "date": "2006-12-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2007,
            "month": 1,
            "count": 563,
            "rate": 2.9,
            "date": "2007-01-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2007,
            "month": 2,
            "count": 489,
            "rate": 2.5,
            "date": "2007-02-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2007,
            "month": 3,
            "count": 495,
            "rate": 2.5,
            "date": "2007-03-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2007,
            "month": 4,
            "count": 555,
            "rate": 2.9,
            "date": "2007-04-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2007,
            "month": 5,
            "count": 622,
            "rate": 3.3,
            "date": "2007-05-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2007,
            "month": 6,
            "count": 653,
            "rate": 3.4,
            "date": "2007-06-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2007,
            "month": 7,
            "count": 665,
            "rate": 3.5,
            "date": "2007-07-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2007,
            "month": 8,
            "count": 648,
            "rate": 3.4,
            "date": "2007-08-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2007,
            "month": 9,
            "count": 630,
            "rate": 3.2,
            "date": "2007-09-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2007,
            "month": 10,
            "count": 534,
            "rate": 2.7,
            "date": "2007-10-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2007,
            "month": 11,
            "count": 526,
            "rate": 2.7,
            "date": "2007-11-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2007,
            "month": 12,
            "count": 521,
            "rate": 2.6,
            "date": "2007-12-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2008,
            "month": 1,
            "count": 576,
            "rate": 2.9,
            "date": "2008-01-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2008,
            "month": 2,
            "count": 562,
            "rate": 2.9,
            "date": "2008-02-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2008,
            "month": 3,
            "count": 609,
            "rate": 3.1,
            "date": "2008-03-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2008,
            "month": 4,
            "count": 551,
            "rate": 2.8,
            "date": "2008-04-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2008,
            "month": 5,
            "count": 619,
            "rate": 3.2,
            "date": "2008-05-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2008,
            "month": 6,
            "count": 669,
            "rate": 3.4,
            "date": "2008-06-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2008,
            "month": 7,
            "count": 776,
            "rate": 3.9,
            "date": "2008-07-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2008,
            "month": 8,
            "count": 844,
            "rate": 4.3,
            "date": "2008-08-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2008,
            "month": 9,
            "count": 835,
            "rate": 4.1,
            "date": "2008-09-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2008,
            "month": 10,
            "count": 797,
            "rate": 3.9,
            "date": "2008-10-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2008,
            "month": 11,
            "count": 748,
            "rate": 3.6,
            "date": "2008-11-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2008,
            "month": 12,
            "count": 791,
            "rate": 3.8,
            "date": "2008-12-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2009,
            "month": 1,
            "count": 792,
            "rate": 3.8,
            "date": "2009-01-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2009,
            "month": 2,
            "count": 847,
            "rate": 4.1,
            "date": "2009-02-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2009,
            "month": 3,
            "count": 931,
            "rate": 4.5,
            "date": "2009-03-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2009,
            "month": 4,
            "count": 964,
            "rate": 4.6,
            "date": "2009-04-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2009,
            "month": 5,
            "count": 1005,
            "rate": 4.9,
            "date": "2009-05-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2009,
            "month": 6,
            "count": 1267,
            "rate": 6.1,
            "date": "2009-06-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2009,
            "month": 7,
            "count": 1269,
            "rate": 6.1,
            "date": "2009-07-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2009,
            "month": 8,
            "count": 1239,
            "rate": 6,
            "date": "2009-08-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2009,
            "month": 9,
            "count": 1257,
            "rate": 6,
            "date": "2009-09-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2009,
            "month": 10,
            "count": 1280,
            "rate": 6,
            "date": "2009-10-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2009,
            "month": 11,
            "count": 1168,
            "rate": 5.5,
            "date": "2009-11-01T07:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2009,
            "month": 12,
            "count": 1183,
            "rate": 5.6,
            "date": "2009-12-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2010,
            "month": 1,
            "count": 1175,
            "rate": 5.5,
            "date": "2010-01-01T08:00:00.000Z"
         },
         {
            "series": "Education and Health",
            "year": 2010,
            "month": 2,
            "count": 1200,
            "rate": 5.6,
            "date": "2010-02-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2000,
            "month": 1,
            "count": 782,
            "rate": 7.5,
            "date": "2000-01-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2000,
            "month": 2,
            "count": 779,
            "rate": 7.5,
            "date": "2000-02-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2000,
            "month": 3,
            "count": 789,
            "rate": 7.4,
            "date": "2000-03-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2000,
            "month": 4,
            "count": 658,
            "rate": 6.1,
            "date": "2000-04-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2000,
            "month": 5,
            "count": 675,
            "rate": 6.2,
            "date": "2000-05-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2000,
            "month": 6,
            "count": 833,
            "rate": 7.3,
            "date": "2000-06-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2000,
            "month": 7,
            "count": 786,
            "rate": 6.8,
            "date": "2000-07-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2000,
            "month": 8,
            "count": 675,
            "rate": 6,
            "date": "2000-08-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2000,
            "month": 9,
            "count": 636,
            "rate": 5.9,
            "date": "2000-09-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2000,
            "month": 10,
            "count": 691,
            "rate": 6.5,
            "date": "2000-10-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2000,
            "month": 11,
            "count": 694,
            "rate": 6.5,
            "date": "2000-11-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2000,
            "month": 12,
            "count": 639,
            "rate": 5.9,
            "date": "2000-12-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2001,
            "month": 1,
            "count": 806,
            "rate": 7.7,
            "date": "2001-01-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2001,
            "month": 2,
            "count": 821,
            "rate": 7.5,
            "date": "2001-02-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2001,
            "month": 3,
            "count": 817,
            "rate": 7.4,
            "date": "2001-03-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2001,
            "month": 4,
            "count": 744,
            "rate": 6.8,
            "date": "2001-04-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2001,
            "month": 5,
            "count": 731,
            "rate": 6.7,
            "date": "2001-05-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2001,
            "month": 6,
            "count": 821,
            "rate": 7,
            "date": "2001-06-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2001,
            "month": 7,
            "count": 813,
            "rate": 6.8,
            "date": "2001-07-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2001,
            "month": 8,
            "count": 767,
            "rate": 6.8,
            "date": "2001-08-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2001,
            "month": 9,
            "count": 900,
            "rate": 8,
            "date": "2001-09-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2001,
            "month": 10,
            "count": 903,
            "rate": 8.3,
            "date": "2001-10-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2001,
            "month": 11,
            "count": 935,
            "rate": 8.5,
            "date": "2001-11-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2001,
            "month": 12,
            "count": 938,
            "rate": 8.5,
            "date": "2001-12-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2002,
            "month": 1,
            "count": 947,
            "rate": 8.6,
            "date": "2002-01-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2002,
            "month": 2,
            "count": 973,
            "rate": 8.7,
            "date": "2002-02-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2002,
            "month": 3,
            "count": 976,
            "rate": 8.5,
            "date": "2002-03-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2002,
            "month": 4,
            "count": 953,
            "rate": 8.4,
            "date": "2002-04-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2002,
            "month": 5,
            "count": 1022,
            "rate": 8.6,
            "date": "2002-05-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2002,
            "month": 6,
            "count": 1034,
            "rate": 8.5,
            "date": "2002-06-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2002,
            "month": 7,
            "count": 999,
            "rate": 8.2,
            "date": "2002-07-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2002,
            "month": 8,
            "count": 884,
            "rate": 7.5,
            "date": "2002-08-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2002,
            "month": 9,
            "count": 885,
            "rate": 7.9,
            "date": "2002-09-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2002,
            "month": 10,
            "count": 956,
            "rate": 8.5,
            "date": "2002-10-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2002,
            "month": 11,
            "count": 978,
            "rate": 8.9,
            "date": "2002-11-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2002,
            "month": 12,
            "count": 922,
            "rate": 8.2,
            "date": "2002-12-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2003,
            "month": 1,
            "count": 1049,
            "rate": 9.3,
            "date": "2003-01-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2003,
            "month": 2,
            "count": 1145,
            "rate": 10,
            "date": "2003-02-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2003,
            "month": 3,
            "count": 1035,
            "rate": 8.9,
            "date": "2003-03-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2003,
            "month": 4,
            "count": 986,
            "rate": 8.5,
            "date": "2003-04-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2003,
            "month": 5,
            "count": 955,
            "rate": 7.9,
            "date": "2003-05-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2003,
            "month": 6,
            "count": 1048,
            "rate": 8.6,
            "date": "2003-06-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2003,
            "month": 7,
            "count": 1020,
            "rate": 8.4,
            "date": "2003-07-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2003,
            "month": 8,
            "count": 1050,
            "rate": 9,
            "date": "2003-08-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2003,
            "month": 9,
            "count": 978,
            "rate": 8.8,
            "date": "2003-09-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2003,
            "month": 10,
            "count": 933,
            "rate": 8.3,
            "date": "2003-10-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2003,
            "month": 11,
            "count": 990,
            "rate": 9,
            "date": "2003-11-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2003,
            "month": 12,
            "count": 885,
            "rate": 8.2,
            "date": "2003-12-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2004,
            "month": 1,
            "count": 1097,
            "rate": 10,
            "date": "2004-01-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2004,
            "month": 2,
            "count": 987,
            "rate": 8.9,
            "date": "2004-02-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2004,
            "month": 3,
            "count": 1039,
            "rate": 9,
            "date": "2004-03-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2004,
            "month": 4,
            "count": 925,
            "rate": 7.9,
            "date": "2004-04-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2004,
            "month": 5,
            "count": 977,
            "rate": 8.1,
            "date": "2004-05-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2004,
            "month": 6,
            "count": 1189,
            "rate": 9.6,
            "date": "2004-06-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2004,
            "month": 7,
            "count": 965,
            "rate": 7.8,
            "date": "2004-07-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2004,
            "month": 8,
            "count": 1010,
            "rate": 8.4,
            "date": "2004-08-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2004,
            "month": 9,
            "count": 854,
            "rate": 7.5,
            "date": "2004-09-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2004,
            "month": 10,
            "count": 853,
            "rate": 7.3,
            "date": "2004-10-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2004,
            "month": 11,
            "count": 916,
            "rate": 7.9,
            "date": "2004-11-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2004,
            "month": 12,
            "count": 850,
            "rate": 7.4,
            "date": "2004-12-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2005,
            "month": 1,
            "count": 993,
            "rate": 8.7,
            "date": "2005-01-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2005,
            "month": 2,
            "count": 1008,
            "rate": 8.8,
            "date": "2005-02-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2005,
            "month": 3,
            "count": 967,
            "rate": 8.3,
            "date": "2005-03-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2005,
            "month": 4,
            "count": 882,
            "rate": 7.7,
            "date": "2005-04-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2005,
            "month": 5,
            "count": 944,
            "rate": 7.7,
            "date": "2005-05-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2005,
            "month": 6,
            "count": 950,
            "rate": 7.6,
            "date": "2005-06-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2005,
            "month": 7,
            "count": 929,
            "rate": 7.4,
            "date": "2005-07-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2005,
            "month": 8,
            "count": 844,
            "rate": 6.8,
            "date": "2005-08-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2005,
            "month": 9,
            "count": 842,
            "rate": 7.3,
            "date": "2005-09-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2005,
            "month": 10,
            "count": 796,
            "rate": 6.8,
            "date": "2005-10-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2005,
            "month": 11,
            "count": 966,
            "rate": 8.1,
            "date": "2005-11-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2005,
            "month": 12,
            "count": 930,
            "rate": 7.9,
            "date": "2005-12-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2006,
            "month": 1,
            "count": 910,
            "rate": 8.1,
            "date": "2006-01-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2006,
            "month": 2,
            "count": 1040,
            "rate": 9.1,
            "date": "2006-02-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2006,
            "month": 3,
            "count": 917,
            "rate": 8,
            "date": "2006-03-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2006,
            "month": 4,
            "count": 882,
            "rate": 7.6,
            "date": "2006-04-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2006,
            "month": 5,
            "count": 830,
            "rate": 7,
            "date": "2006-05-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2006,
            "month": 6,
            "count": 942,
            "rate": 7.4,
            "date": "2006-06-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2006,
            "month": 7,
            "count": 867,
            "rate": 6.8,
            "date": "2006-07-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2006,
            "month": 8,
            "count": 855,
            "rate": 6.9,
            "date": "2006-08-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2006,
            "month": 9,
            "count": 810,
            "rate": 6.9,
            "date": "2006-09-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2006,
            "month": 10,
            "count": 795,
            "rate": 6.6,
            "date": "2006-10-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2006,
            "month": 11,
            "count": 836,
            "rate": 7.1,
            "date": "2006-11-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2006,
            "month": 12,
            "count": 701,
            "rate": 5.9,
            "date": "2006-12-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2007,
            "month": 1,
            "count": 911,
            "rate": 7.8,
            "date": "2007-01-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2007,
            "month": 2,
            "count": 879,
            "rate": 7.4,
            "date": "2007-02-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2007,
            "month": 3,
            "count": 845,
            "rate": 7,
            "date": "2007-03-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2007,
            "month": 4,
            "count": 822,
            "rate": 6.9,
            "date": "2007-04-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2007,
            "month": 5,
            "count": 831,
            "rate": 6.8,
            "date": "2007-05-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2007,
            "month": 6,
            "count": 917,
            "rate": 7.2,
            "date": "2007-06-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2007,
            "month": 7,
            "count": 920,
            "rate": 7.3,
            "date": "2007-07-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2007,
            "month": 8,
            "count": 877,
            "rate": 7.1,
            "date": "2007-08-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2007,
            "month": 9,
            "count": 892,
            "rate": 7.4,
            "date": "2007-09-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2007,
            "month": 10,
            "count": 911,
            "rate": 7.5,
            "date": "2007-10-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2007,
            "month": 11,
            "count": 986,
            "rate": 8.1,
            "date": "2007-11-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2007,
            "month": 12,
            "count": 961,
            "rate": 7.9,
            "date": "2007-12-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2008,
            "month": 1,
            "count": 1176,
            "rate": 9.4,
            "date": "2008-01-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2008,
            "month": 2,
            "count": 1056,
            "rate": 8.5,
            "date": "2008-02-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2008,
            "month": 3,
            "count": 944,
            "rate": 7.6,
            "date": "2008-03-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2008,
            "month": 4,
            "count": 874,
            "rate": 6.9,
            "date": "2008-04-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2008,
            "month": 5,
            "count": 1074,
            "rate": 8.4,
            "date": "2008-05-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2008,
            "month": 6,
            "count": 1154,
            "rate": 8.9,
            "date": "2008-06-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2008,
            "month": 7,
            "count": 1172,
            "rate": 8.8,
            "date": "2008-07-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2008,
            "month": 8,
            "count": 1122,
            "rate": 8.7,
            "date": "2008-08-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2008,
            "month": 9,
            "count": 1029,
            "rate": 8.2,
            "date": "2008-09-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2008,
            "month": 10,
            "count": 1126,
            "rate": 8.9,
            "date": "2008-10-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2008,
            "month": 11,
            "count": 1283,
            "rate": 9.9,
            "date": "2008-11-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2008,
            "month": 12,
            "count": 1210,
            "rate": 9.5,
            "date": "2008-12-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2009,
            "month": 1,
            "count": 1487,
            "rate": 11.5,
            "date": "2009-01-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2009,
            "month": 2,
            "count": 1477,
            "rate": 11.4,
            "date": "2009-02-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2009,
            "month": 3,
            "count": 1484,
            "rate": 11.6,
            "date": "2009-03-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2009,
            "month": 4,
            "count": 1322,
            "rate": 10.2,
            "date": "2009-04-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2009,
            "month": 5,
            "count": 1599,
            "rate": 11.9,
            "date": "2009-05-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2009,
            "month": 6,
            "count": 1688,
            "rate": 12.1,
            "date": "2009-06-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2009,
            "month": 7,
            "count": 1600,
            "rate": 11.2,
            "date": "2009-07-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2009,
            "month": 8,
            "count": 1636,
            "rate": 12,
            "date": "2009-08-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2009,
            "month": 9,
            "count": 1469,
            "rate": 11.4,
            "date": "2009-09-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2009,
            "month": 10,
            "count": 1604,
            "rate": 12.4,
            "date": "2009-10-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2009,
            "month": 11,
            "count": 1524,
            "rate": 11.9,
            "date": "2009-11-01T07:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2009,
            "month": 12,
            "count": 1624,
            "rate": 12.6,
            "date": "2009-12-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2010,
            "month": 1,
            "count": 1804,
            "rate": 14.2,
            "date": "2010-01-01T08:00:00.000Z"
         },
         {
            "series": "Leisure and hospitality",
            "year": 2010,
            "month": 2,
            "count": 1597,
            "rate": 12.7,
            "date": "2010-02-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2000,
            "month": 1,
            "count": 274,
            "rate": 4.9,
            "date": "2000-01-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2000,
            "month": 2,
            "count": 232,
            "rate": 4.1,
            "date": "2000-02-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2000,
            "month": 3,
            "count": 247,
            "rate": 4.3,
            "date": "2000-03-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2000,
            "month": 4,
            "count": 240,
            "rate": 4.2,
            "date": "2000-04-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2000,
            "month": 5,
            "count": 254,
            "rate": 4.5,
            "date": "2000-05-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2000,
            "month": 6,
            "count": 225,
            "rate": 3.9,
            "date": "2000-06-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2000,
            "month": 7,
            "count": 202,
            "rate": 3.7,
            "date": "2000-07-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2000,
            "month": 8,
            "count": 187,
            "rate": 3.5,
            "date": "2000-08-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2000,
            "month": 9,
            "count": 220,
            "rate": 4,
            "date": "2000-09-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2000,
            "month": 10,
            "count": 161,
            "rate": 2.9,
            "date": "2000-10-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2000,
            "month": 11,
            "count": 217,
            "rate": 3.8,
            "date": "2000-11-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2000,
            "month": 12,
            "count": 167,
            "rate": 2.9,
            "date": "2000-12-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2001,
            "month": 1,
            "count": 197,
            "rate": 3.4,
            "date": "2001-01-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2001,
            "month": 2,
            "count": 243,
            "rate": 4.2,
            "date": "2001-02-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2001,
            "month": 3,
            "count": 200,
            "rate": 3.4,
            "date": "2001-03-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2001,
            "month": 4,
            "count": 220,
            "rate": 3.8,
            "date": "2001-04-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2001,
            "month": 5,
            "count": 172,
            "rate": 3.2,
            "date": "2001-05-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2001,
            "month": 6,
            "count": 246,
            "rate": 4.6,
            "date": "2001-06-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2001,
            "month": 7,
            "count": 228,
            "rate": 4.1,
            "date": "2001-07-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2001,
            "month": 8,
            "count": 241,
            "rate": 4.5,
            "date": "2001-08-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2001,
            "month": 9,
            "count": 225,
            "rate": 4,
            "date": "2001-09-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2001,
            "month": 10,
            "count": 239,
            "rate": 4.1,
            "date": "2001-10-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2001,
            "month": 11,
            "count": 256,
            "rate": 4.2,
            "date": "2001-11-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2001,
            "month": 12,
            "count": 277,
            "rate": 4.5,
            "date": "2001-12-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2002,
            "month": 1,
            "count": 304,
            "rate": 5.1,
            "date": "2002-01-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2002,
            "month": 2,
            "count": 339,
            "rate": 5.6,
            "date": "2002-02-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2002,
            "month": 3,
            "count": 314,
            "rate": 5.5,
            "date": "2002-03-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2002,
            "month": 4,
            "count": 268,
            "rate": 4.6,
            "date": "2002-04-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2002,
            "month": 5,
            "count": 264,
            "rate": 4.6,
            "date": "2002-05-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2002,
            "month": 6,
            "count": 335,
            "rate": 5.5,
            "date": "2002-06-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2002,
            "month": 7,
            "count": 356,
            "rate": 5.8,
            "date": "2002-07-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2002,
            "month": 8,
            "count": 353,
            "rate": 6,
            "date": "2002-08-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2002,
            "month": 9,
            "count": 281,
            "rate": 4.8,
            "date": "2002-09-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2002,
            "month": 10,
            "count": 272,
            "rate": 4.6,
            "date": "2002-10-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2002,
            "month": 11,
            "count": 284,
            "rate": 4.9,
            "date": "2002-11-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2002,
            "month": 12,
            "count": 241,
            "rate": 4.2,
            "date": "2002-12-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2003,
            "month": 1,
            "count": 304,
            "rate": 5.3,
            "date": "2003-01-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2003,
            "month": 2,
            "count": 331,
            "rate": 5.7,
            "date": "2003-02-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2003,
            "month": 3,
            "count": 370,
            "rate": 6.1,
            "date": "2003-03-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2003,
            "month": 4,
            "count": 331,
            "rate": 5.5,
            "date": "2003-04-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2003,
            "month": 5,
            "count": 339,
            "rate": 5.7,
            "date": "2003-05-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2003,
            "month": 6,
            "count": 359,
            "rate": 5.9,
            "date": "2003-06-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2003,
            "month": 7,
            "count": 405,
            "rate": 6.6,
            "date": "2003-07-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2003,
            "month": 8,
            "count": 373,
            "rate": 6.1,
            "date": "2003-08-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2003,
            "month": 9,
            "count": 338,
            "rate": 5.5,
            "date": "2003-09-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2003,
            "month": 10,
            "count": 378,
            "rate": 6.1,
            "date": "2003-10-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2003,
            "month": 11,
            "count": 357,
            "rate": 5.8,
            "date": "2003-11-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2003,
            "month": 12,
            "count": 278,
            "rate": 4.5,
            "date": "2003-12-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2004,
            "month": 1,
            "count": 322,
            "rate": 5.3,
            "date": "2004-01-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2004,
            "month": 2,
            "count": 366,
            "rate": 5.9,
            "date": "2004-02-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2004,
            "month": 3,
            "count": 366,
            "rate": 5.9,
            "date": "2004-03-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2004,
            "month": 4,
            "count": 347,
            "rate": 5.6,
            "date": "2004-04-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2004,
            "month": 5,
            "count": 310,
            "rate": 5.1,
            "date": "2004-05-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2004,
            "month": 6,
            "count": 326,
            "rate": 5.4,
            "date": "2004-06-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2004,
            "month": 7,
            "count": 346,
            "rate": 5.6,
            "date": "2004-07-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2004,
            "month": 8,
            "count": 341,
            "rate": 5.6,
            "date": "2004-08-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2004,
            "month": 9,
            "count": 301,
            "rate": 4.9,
            "date": "2004-09-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2004,
            "month": 10,
            "count": 300,
            "rate": 4.8,
            "date": "2004-10-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2004,
            "month": 11,
            "count": 294,
            "rate": 4.8,
            "date": "2004-11-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2004,
            "month": 12,
            "count": 276,
            "rate": 4.3,
            "date": "2004-12-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2005,
            "month": 1,
            "count": 290,
            "rate": 4.7,
            "date": "2005-01-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2005,
            "month": 2,
            "count": 325,
            "rate": 5.3,
            "date": "2005-02-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2005,
            "month": 3,
            "count": 308,
            "rate": 5,
            "date": "2005-03-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2005,
            "month": 4,
            "count": 306,
            "rate": 4.9,
            "date": "2005-04-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2005,
            "month": 5,
            "count": 314,
            "rate": 5,
            "date": "2005-05-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2005,
            "month": 6,
            "count": 291,
            "rate": 4.6,
            "date": "2005-06-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2005,
            "month": 7,
            "count": 274,
            "rate": 4.2,
            "date": "2005-07-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2005,
            "month": 8,
            "count": 306,
            "rate": 4.8,
            "date": "2005-08-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2005,
            "month": 9,
            "count": 307,
            "rate": 4.9,
            "date": "2005-09-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2005,
            "month": 10,
            "count": 319,
            "rate": 5,
            "date": "2005-10-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2005,
            "month": 11,
            "count": 300,
            "rate": 4.9,
            "date": "2005-11-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2005,
            "month": 12,
            "count": 269,
            "rate": 4.3,
            "date": "2005-12-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2006,
            "month": 1,
            "count": 308,
            "rate": 4.9,
            "date": "2006-01-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2006,
            "month": 2,
            "count": 281,
            "rate": 4.4,
            "date": "2006-02-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2006,
            "month": 3,
            "count": 292,
            "rate": 4.6,
            "date": "2006-03-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2006,
            "month": 4,
            "count": 266,
            "rate": 4.1,
            "date": "2006-04-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2006,
            "month": 5,
            "count": 265,
            "rate": 4.2,
            "date": "2006-05-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2006,
            "month": 6,
            "count": 265,
            "rate": 4.3,
            "date": "2006-06-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2006,
            "month": 7,
            "count": 305,
            "rate": 4.7,
            "date": "2006-07-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2006,
            "month": 8,
            "count": 341,
            "rate": 5.3,
            "date": "2006-08-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2006,
            "month": 9,
            "count": 310,
            "rate": 5,
            "date": "2006-09-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2006,
            "month": 10,
            "count": 268,
            "rate": 4.4,
            "date": "2006-10-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2006,
            "month": 11,
            "count": 306,
            "rate": 5,
            "date": "2006-11-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2006,
            "month": 12,
            "count": 306,
            "rate": 5.2,
            "date": "2006-12-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2007,
            "month": 1,
            "count": 275,
            "rate": 4.7,
            "date": "2007-01-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2007,
            "month": 2,
            "count": 257,
            "rate": 4.3,
            "date": "2007-02-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2007,
            "month": 3,
            "count": 222,
            "rate": 3.7,
            "date": "2007-03-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2007,
            "month": 4,
            "count": 224,
            "rate": 3.6,
            "date": "2007-04-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2007,
            "month": 5,
            "count": 242,
            "rate": 3.9,
            "date": "2007-05-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2007,
            "month": 6,
            "count": 256,
            "rate": 4,
            "date": "2007-06-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2007,
            "month": 7,
            "count": 243,
            "rate": 3.8,
            "date": "2007-07-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2007,
            "month": 8,
            "count": 239,
            "rate": 3.8,
            "date": "2007-08-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2007,
            "month": 9,
            "count": 257,
            "rate": 4.2,
            "date": "2007-09-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2007,
            "month": 10,
            "count": 182,
            "rate": 3,
            "date": "2007-10-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2007,
            "month": 11,
            "count": 255,
            "rate": 4.1,
            "date": "2007-11-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2007,
            "month": 12,
            "count": 235,
            "rate": 3.9,
            "date": "2007-12-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2008,
            "month": 1,
            "count": 264,
            "rate": 4.4,
            "date": "2008-01-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2008,
            "month": 2,
            "count": 313,
            "rate": 5.1,
            "date": "2008-02-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2008,
            "month": 3,
            "count": 283,
            "rate": 4.6,
            "date": "2008-03-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2008,
            "month": 4,
            "count": 251,
            "rate": 4,
            "date": "2008-04-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2008,
            "month": 5,
            "count": 275,
            "rate": 4.4,
            "date": "2008-05-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2008,
            "month": 6,
            "count": 322,
            "rate": 5,
            "date": "2008-06-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2008,
            "month": 7,
            "count": 352,
            "rate": 5.2,
            "date": "2008-07-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2008,
            "month": 8,
            "count": 412,
            "rate": 6.3,
            "date": "2008-08-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2008,
            "month": 9,
            "count": 374,
            "rate": 5.8,
            "date": "2008-09-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2008,
            "month": 10,
            "count": 334,
            "rate": 5.3,
            "date": "2008-10-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2008,
            "month": 11,
            "count": 434,
            "rate": 7,
            "date": "2008-11-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2008,
            "month": 12,
            "count": 367,
            "rate": 6.1,
            "date": "2008-12-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2009,
            "month": 1,
            "count": 431,
            "rate": 7.1,
            "date": "2009-01-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2009,
            "month": 2,
            "count": 453,
            "rate": 7.3,
            "date": "2009-02-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2009,
            "month": 3,
            "count": 377,
            "rate": 6,
            "date": "2009-03-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2009,
            "month": 4,
            "count": 403,
            "rate": 6.4,
            "date": "2009-04-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2009,
            "month": 5,
            "count": 476,
            "rate": 7.5,
            "date": "2009-05-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2009,
            "month": 6,
            "count": 557,
            "rate": 8.4,
            "date": "2009-06-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2009,
            "month": 7,
            "count": 490,
            "rate": 7.4,
            "date": "2009-07-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2009,
            "month": 8,
            "count": 528,
            "rate": 8.2,
            "date": "2009-08-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2009,
            "month": 9,
            "count": 462,
            "rate": 7.1,
            "date": "2009-09-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2009,
            "month": 10,
            "count": 541,
            "rate": 8.5,
            "date": "2009-10-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2009,
            "month": 11,
            "count": 491,
            "rate": 8,
            "date": "2009-11-01T07:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2009,
            "month": 12,
            "count": 513,
            "rate": 8.2,
            "date": "2009-12-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2010,
            "month": 1,
            "count": 609,
            "rate": 10,
            "date": "2010-01-01T08:00:00.000Z"
         },
         {
            "series": "Other",
            "year": 2010,
            "month": 2,
            "count": 603,
            "rate": 9.9,
            "date": "2010-02-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2000,
            "month": 1,
            "count": 154,
            "rate": 10.3,
            "date": "2000-01-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2000,
            "month": 2,
            "count": 173,
            "rate": 11.5,
            "date": "2000-02-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2000,
            "month": 3,
            "count": 152,
            "rate": 10.4,
            "date": "2000-03-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2000,
            "month": 4,
            "count": 135,
            "rate": 8.9,
            "date": "2000-04-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2000,
            "month": 5,
            "count": 73,
            "rate": 5.1,
            "date": "2000-05-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2000,
            "month": 6,
            "count": 109,
            "rate": 6.7,
            "date": "2000-06-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2000,
            "month": 7,
            "count": 77,
            "rate": 5,
            "date": "2000-07-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2000,
            "month": 8,
            "count": 110,
            "rate": 7,
            "date": "2000-08-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2000,
            "month": 9,
            "count": 124,
            "rate": 8.2,
            "date": "2000-09-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2000,
            "month": 10,
            "count": 113,
            "rate": 8,
            "date": "2000-10-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2000,
            "month": 11,
            "count": 192,
            "rate": 13.3,
            "date": "2000-11-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2000,
            "month": 12,
            "count": 196,
            "rate": 13.9,
            "date": "2000-12-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2001,
            "month": 1,
            "count": 188,
            "rate": 13.8,
            "date": "2001-01-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2001,
            "month": 2,
            "count": 193,
            "rate": 15.1,
            "date": "2001-02-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2001,
            "month": 3,
            "count": 267,
            "rate": 19.2,
            "date": "2001-03-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2001,
            "month": 4,
            "count": 140,
            "rate": 10.4,
            "date": "2001-04-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2001,
            "month": 5,
            "count": 109,
            "rate": 7.7,
            "date": "2001-05-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2001,
            "month": 6,
            "count": 130,
            "rate": 9.7,
            "date": "2001-06-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2001,
            "month": 7,
            "count": 113,
            "rate": 7.6,
            "date": "2001-07-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2001,
            "month": 8,
            "count": 141,
            "rate": 9.3,
            "date": "2001-08-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2001,
            "month": 9,
            "count": 101,
            "rate": 7.2,
            "date": "2001-09-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2001,
            "month": 10,
            "count": 118,
            "rate": 8.7,
            "date": "2001-10-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2001,
            "month": 11,
            "count": 145,
            "rate": 11.6,
            "date": "2001-11-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2001,
            "month": 12,
            "count": 192,
            "rate": 15.1,
            "date": "2001-12-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2002,
            "month": 1,
            "count": 195,
            "rate": 14.8,
            "date": "2002-01-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2002,
            "month": 2,
            "count": 187,
            "rate": 14.8,
            "date": "2002-02-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2002,
            "month": 3,
            "count": 269,
            "rate": 19.6,
            "date": "2002-03-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2002,
            "month": 4,
            "count": 151,
            "rate": 10.8,
            "date": "2002-04-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2002,
            "month": 5,
            "count": 89,
            "rate": 6.8,
            "date": "2002-05-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2002,
            "month": 6,
            "count": 89,
            "rate": 6.3,
            "date": "2002-06-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2002,
            "month": 7,
            "count": 114,
            "rate": 7.3,
            "date": "2002-07-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2002,
            "month": 8,
            "count": 125,
            "rate": 9,
            "date": "2002-08-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2002,
            "month": 9,
            "count": 92,
            "rate": 6.3,
            "date": "2002-09-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2002,
            "month": 10,
            "count": 97,
            "rate": 6.6,
            "date": "2002-10-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2002,
            "month": 11,
            "count": 137,
            "rate": 11.1,
            "date": "2002-11-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2002,
            "month": 12,
            "count": 120,
            "rate": 9.8,
            "date": "2002-12-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2003,
            "month": 1,
            "count": 159,
            "rate": 13.2,
            "date": "2003-01-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2003,
            "month": 2,
            "count": 172,
            "rate": 14.7,
            "date": "2003-02-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2003,
            "month": 3,
            "count": 161,
            "rate": 12.9,
            "date": "2003-03-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2003,
            "month": 4,
            "count": 154,
            "rate": 12,
            "date": "2003-04-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2003,
            "month": 5,
            "count": 133,
            "rate": 10.2,
            "date": "2003-05-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2003,
            "month": 6,
            "count": 94,
            "rate": 6.9,
            "date": "2003-06-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2003,
            "month": 7,
            "count": 113,
            "rate": 8.2,
            "date": "2003-07-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2003,
            "month": 8,
            "count": 173,
            "rate": 10.7,
            "date": "2003-08-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2003,
            "month": 9,
            "count": 98,
            "rate": 6.2,
            "date": "2003-09-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2003,
            "month": 10,
            "count": 136,
            "rate": 8.5,
            "date": "2003-10-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2003,
            "month": 11,
            "count": 148,
            "rate": 10.3,
            "date": "2003-11-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2003,
            "month": 12,
            "count": 137,
            "rate": 10.9,
            "date": "2003-12-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2004,
            "month": 1,
            "count": 184,
            "rate": 15.1,
            "date": "2004-01-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2004,
            "month": 2,
            "count": 168,
            "rate": 14.2,
            "date": "2004-02-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2004,
            "month": 3,
            "count": 153,
            "rate": 12.7,
            "date": "2004-03-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2004,
            "month": 4,
            "count": 107,
            "rate": 8.3,
            "date": "2004-04-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2004,
            "month": 5,
            "count": 99,
            "rate": 7.4,
            "date": "2004-05-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2004,
            "month": 6,
            "count": 106,
            "rate": 7.6,
            "date": "2004-06-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2004,
            "month": 7,
            "count": 140,
            "rate": 10,
            "date": "2004-07-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2004,
            "month": 8,
            "count": 103,
            "rate": 7,
            "date": "2004-08-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2004,
            "month": 9,
            "count": 88,
            "rate": 6.4,
            "date": "2004-09-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2004,
            "month": 10,
            "count": 102,
            "rate": 7.7,
            "date": "2004-10-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2004,
            "month": 11,
            "count": 131,
            "rate": 10.5,
            "date": "2004-11-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2004,
            "month": 12,
            "count": 165,
            "rate": 14,
            "date": "2004-12-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2005,
            "month": 1,
            "count": 153,
            "rate": 13.2,
            "date": "2005-01-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2005,
            "month": 2,
            "count": 107,
            "rate": 9.9,
            "date": "2005-02-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2005,
            "month": 3,
            "count": 139,
            "rate": 11.8,
            "date": "2005-03-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2005,
            "month": 4,
            "count": 84,
            "rate": 6.9,
            "date": "2005-04-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2005,
            "month": 5,
            "count": 66,
            "rate": 5.3,
            "date": "2005-05-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2005,
            "month": 6,
            "count": 76,
            "rate": 5.2,
            "date": "2005-06-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2005,
            "month": 7,
            "count": 69,
            "rate": 4.7,
            "date": "2005-07-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2005,
            "month": 8,
            "count": 100,
            "rate": 7.1,
            "date": "2005-08-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2005,
            "month": 9,
            "count": 127,
            "rate": 9.5,
            "date": "2005-09-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2005,
            "month": 10,
            "count": 85,
            "rate": 6.7,
            "date": "2005-10-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2005,
            "month": 11,
            "count": 118,
            "rate": 9.6,
            "date": "2005-11-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2005,
            "month": 12,
            "count": 127,
            "rate": 11.1,
            "date": "2005-12-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2006,
            "month": 1,
            "count": 140,
            "rate": 11.5,
            "date": "2006-01-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2006,
            "month": 2,
            "count": 139,
            "rate": 11.8,
            "date": "2006-02-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2006,
            "month": 3,
            "count": 117,
            "rate": 9.8,
            "date": "2006-03-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2006,
            "month": 4,
            "count": 81,
            "rate": 6.2,
            "date": "2006-04-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2006,
            "month": 5,
            "count": 79,
            "rate": 6,
            "date": "2006-05-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2006,
            "month": 6,
            "count": 35,
            "rate": 2.4,
            "date": "2006-06-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2006,
            "month": 7,
            "count": 55,
            "rate": 3.6,
            "date": "2006-07-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2006,
            "month": 8,
            "count": 76,
            "rate": 5.3,
            "date": "2006-08-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2006,
            "month": 9,
            "count": 78,
            "rate": 5.9,
            "date": "2006-09-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2006,
            "month": 10,
            "count": 77,
            "rate": 5.8,
            "date": "2006-10-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2006,
            "month": 11,
            "count": 125,
            "rate": 9.6,
            "date": "2006-11-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2006,
            "month": 12,
            "count": 139,
            "rate": 10.4,
            "date": "2006-12-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2007,
            "month": 1,
            "count": 128,
            "rate": 10,
            "date": "2007-01-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2007,
            "month": 2,
            "count": 127,
            "rate": 9.6,
            "date": "2007-02-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2007,
            "month": 3,
            "count": 123,
            "rate": 9.7,
            "date": "2007-03-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2007,
            "month": 4,
            "count": 67,
            "rate": 5.7,
            "date": "2007-04-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2007,
            "month": 5,
            "count": 64,
            "rate": 5.1,
            "date": "2007-05-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2007,
            "month": 6,
            "count": 59,
            "rate": 4.5,
            "date": "2007-06-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2007,
            "month": 7,
            "count": 40,
            "rate": 3.1,
            "date": "2007-07-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2007,
            "month": 8,
            "count": 54,
            "rate": 4.7,
            "date": "2007-08-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2007,
            "month": 9,
            "count": 53,
            "rate": 4.3,
            "date": "2007-09-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2007,
            "month": 10,
            "count": 47,
            "rate": 4,
            "date": "2007-10-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2007,
            "month": 11,
            "count": 80,
            "rate": 6.6,
            "date": "2007-11-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2007,
            "month": 12,
            "count": 96,
            "rate": 7.5,
            "date": "2007-12-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2008,
            "month": 1,
            "count": 113,
            "rate": 9.5,
            "date": "2008-01-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2008,
            "month": 2,
            "count": 135,
            "rate": 10.9,
            "date": "2008-02-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2008,
            "month": 3,
            "count": 175,
            "rate": 13.2,
            "date": "2008-03-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2008,
            "month": 4,
            "count": 108,
            "rate": 8.6,
            "date": "2008-04-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2008,
            "month": 5,
            "count": 94,
            "rate": 7.4,
            "date": "2008-05-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2008,
            "month": 6,
            "count": 86,
            "rate": 6.1,
            "date": "2008-06-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2008,
            "month": 7,
            "count": 125,
            "rate": 8.5,
            "date": "2008-07-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2008,
            "month": 8,
            "count": 111,
            "rate": 7.6,
            "date": "2008-08-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2008,
            "month": 9,
            "count": 84,
            "rate": 5.8,
            "date": "2008-09-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2008,
            "month": 10,
            "count": 97,
            "rate": 7.1,
            "date": "2008-10-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2008,
            "month": 11,
            "count": 119,
            "rate": 9.5,
            "date": "2008-11-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2008,
            "month": 12,
            "count": 229,
            "rate": 17,
            "date": "2008-12-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2009,
            "month": 1,
            "count": 245,
            "rate": 18.7,
            "date": "2009-01-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2009,
            "month": 2,
            "count": 251,
            "rate": 18.8,
            "date": "2009-02-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2009,
            "month": 3,
            "count": 241,
            "rate": 19,
            "date": "2009-03-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2009,
            "month": 4,
            "count": 176,
            "rate": 13.5,
            "date": "2009-04-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2009,
            "month": 5,
            "count": 136,
            "rate": 10,
            "date": "2009-05-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2009,
            "month": 6,
            "count": 182,
            "rate": 12.3,
            "date": "2009-06-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2009,
            "month": 7,
            "count": 180,
            "rate": 12.1,
            "date": "2009-07-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2009,
            "month": 8,
            "count": 195,
            "rate": 13.1,
            "date": "2009-08-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2009,
            "month": 9,
            "count": 150,
            "rate": 11.1,
            "date": "2009-09-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2009,
            "month": 10,
            "count": 166,
            "rate": 11.8,
            "date": "2009-10-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2009,
            "month": 11,
            "count": 180,
            "rate": 12.6,
            "date": "2009-11-01T07:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2009,
            "month": 12,
            "count": 292,
            "rate": 19.7,
            "date": "2009-12-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2010,
            "month": 1,
            "count": 318,
            "rate": 21.3,
            "date": "2010-01-01T08:00:00.000Z"
         },
         {
            "series": "Agriculture",
            "year": 2010,
            "month": 2,
            "count": 285,
            "rate": 18.8,
            "date": "2010-02-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2000,
            "month": 1,
            "count": 239,
            "rate": 2.3,
            "date": "2000-01-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2000,
            "month": 2,
            "count": 262,
            "rate": 2.5,
            "date": "2000-02-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2000,
            "month": 3,
            "count": 213,
            "rate": 2,
            "date": "2000-03-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2000,
            "month": 4,
            "count": 218,
            "rate": 2,
            "date": "2000-04-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2000,
            "month": 5,
            "count": 206,
            "rate": 1.9,
            "date": "2000-05-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2000,
            "month": 6,
            "count": 188,
            "rate": 1.8,
            "date": "2000-06-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2000,
            "month": 7,
            "count": 222,
            "rate": 2.1,
            "date": "2000-07-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2000,
            "month": 8,
            "count": 186,
            "rate": 1.7,
            "date": "2000-08-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2000,
            "month": 9,
            "count": 213,
            "rate": 2,
            "date": "2000-09-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2000,
            "month": 10,
            "count": 226,
            "rate": 2.2,
            "date": "2000-10-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2000,
            "month": 11,
            "count": 273,
            "rate": 2.7,
            "date": "2000-11-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2000,
            "month": 12,
            "count": 178,
            "rate": 1.8,
            "date": "2000-12-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2001,
            "month": 1,
            "count": 194,
            "rate": 1.9,
            "date": "2001-01-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2001,
            "month": 2,
            "count": 209,
            "rate": 2,
            "date": "2001-02-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2001,
            "month": 3,
            "count": 181,
            "rate": 1.7,
            "date": "2001-03-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2001,
            "month": 4,
            "count": 216,
            "rate": 2.1,
            "date": "2001-04-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2001,
            "month": 5,
            "count": 206,
            "rate": 2,
            "date": "2001-05-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2001,
            "month": 6,
            "count": 187,
            "rate": 1.7,
            "date": "2001-06-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2001,
            "month": 7,
            "count": 191,
            "rate": 1.8,
            "date": "2001-07-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2001,
            "month": 8,
            "count": 243,
            "rate": 2.3,
            "date": "2001-08-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2001,
            "month": 9,
            "count": 256,
            "rate": 2.4,
            "date": "2001-09-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2001,
            "month": 10,
            "count": 247,
            "rate": 2.3,
            "date": "2001-10-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2001,
            "month": 11,
            "count": 234,
            "rate": 2.3,
            "date": "2001-11-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2001,
            "month": 12,
            "count": 249,
            "rate": 2.5,
            "date": "2001-12-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2002,
            "month": 1,
            "count": 263,
            "rate": 2.7,
            "date": "2002-01-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2002,
            "month": 2,
            "count": 250,
            "rate": 2.6,
            "date": "2002-02-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2002,
            "month": 3,
            "count": 217,
            "rate": 2.2,
            "date": "2002-03-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2002,
            "month": 4,
            "count": 255,
            "rate": 2.5,
            "date": "2002-04-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2002,
            "month": 5,
            "count": 264,
            "rate": 2.6,
            "date": "2002-05-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2002,
            "month": 6,
            "count": 246,
            "rate": 2.4,
            "date": "2002-06-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2002,
            "month": 7,
            "count": 249,
            "rate": 2.4,
            "date": "2002-07-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2002,
            "month": 8,
            "count": 271,
            "rate": 2.6,
            "date": "2002-08-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2002,
            "month": 9,
            "count": 266,
            "rate": 2.5,
            "date": "2002-09-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2002,
            "month": 10,
            "count": 275,
            "rate": 2.6,
            "date": "2002-10-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2002,
            "month": 11,
            "count": 297,
            "rate": 2.8,
            "date": "2002-11-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2002,
            "month": 12,
            "count": 327,
            "rate": 3.1,
            "date": "2002-12-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2003,
            "month": 1,
            "count": 324,
            "rate": 3,
            "date": "2003-01-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2003,
            "month": 2,
            "count": 304,
            "rate": 3,
            "date": "2003-02-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2003,
            "month": 3,
            "count": 279,
            "rate": 2.7,
            "date": "2003-03-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2003,
            "month": 4,
            "count": 248,
            "rate": 2.4,
            "date": "2003-04-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2003,
            "month": 5,
            "count": 271,
            "rate": 2.6,
            "date": "2003-05-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2003,
            "month": 6,
            "count": 295,
            "rate": 2.7,
            "date": "2003-06-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2003,
            "month": 7,
            "count": 270,
            "rate": 2.5,
            "date": "2003-07-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2003,
            "month": 8,
            "count": 302,
            "rate": 2.7,
            "date": "2003-08-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2003,
            "month": 9,
            "count": 287,
            "rate": 2.6,
            "date": "2003-09-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2003,
            "month": 10,
            "count": 338,
            "rate": 3.1,
            "date": "2003-10-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2003,
            "month": 11,
            "count": 308,
            "rate": 2.8,
            "date": "2003-11-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2003,
            "month": 12,
            "count": 299,
            "rate": 2.8,
            "date": "2003-12-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2004,
            "month": 1,
            "count": 302,
            "rate": 2.8,
            "date": "2004-01-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2004,
            "month": 2,
            "count": 260,
            "rate": 2.5,
            "date": "2004-02-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2004,
            "month": 3,
            "count": 260,
            "rate": 2.5,
            "date": "2004-03-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2004,
            "month": 4,
            "count": 242,
            "rate": 2.3,
            "date": "2004-04-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2004,
            "month": 5,
            "count": 287,
            "rate": 2.7,
            "date": "2004-05-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2004,
            "month": 6,
            "count": 306,
            "rate": 2.8,
            "date": "2004-06-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2004,
            "month": 7,
            "count": 291,
            "rate": 2.6,
            "date": "2004-07-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2004,
            "month": 8,
            "count": 324,
            "rate": 2.9,
            "date": "2004-08-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2004,
            "month": 9,
            "count": 362,
            "rate": 3.3,
            "date": "2004-09-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2004,
            "month": 10,
            "count": 301,
            "rate": 2.7,
            "date": "2004-10-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2004,
            "month": 11,
            "count": 353,
            "rate": 3.2,
            "date": "2004-11-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2004,
            "month": 12,
            "count": 341,
            "rate": 3.2,
            "date": "2004-12-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2005,
            "month": 1,
            "count": 346,
            "rate": 3.2,
            "date": "2005-01-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2005,
            "month": 2,
            "count": 363,
            "rate": 3.4,
            "date": "2005-02-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2005,
            "month": 3,
            "count": 312,
            "rate": 2.9,
            "date": "2005-03-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2005,
            "month": 4,
            "count": 273,
            "rate": 2.4,
            "date": "2005-04-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2005,
            "month": 5,
            "count": 299,
            "rate": 2.7,
            "date": "2005-05-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2005,
            "month": 6,
            "count": 268,
            "rate": 2.4,
            "date": "2005-06-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2005,
            "month": 7,
            "count": 282,
            "rate": 2.5,
            "date": "2005-07-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2005,
            "month": 8,
            "count": 249,
            "rate": 2.3,
            "date": "2005-08-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2005,
            "month": 9,
            "count": 282,
            "rate": 2.6,
            "date": "2005-09-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2005,
            "month": 10,
            "count": 255,
            "rate": 2.3,
            "date": "2005-10-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2005,
            "month": 11,
            "count": 319,
            "rate": 3,
            "date": "2005-11-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2005,
            "month": 12,
            "count": 327,
            "rate": 3.1,
            "date": "2005-12-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2006,
            "month": 1,
            "count": 341,
            "rate": 3.2,
            "date": "2006-01-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2006,
            "month": 2,
            "count": 332,
            "rate": 3.1,
            "date": "2006-02-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2006,
            "month": 3,
            "count": 300,
            "rate": 2.8,
            "date": "2006-03-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2006,
            "month": 4,
            "count": 334,
            "rate": 3.1,
            "date": "2006-04-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2006,
            "month": 5,
            "count": 251,
            "rate": 2.3,
            "date": "2006-05-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2006,
            "month": 6,
            "count": 245,
            "rate": 2.2,
            "date": "2006-06-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2006,
            "month": 7,
            "count": 291,
            "rate": 2.6,
            "date": "2006-07-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2006,
            "month": 8,
            "count": 306,
            "rate": 2.7,
            "date": "2006-08-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2006,
            "month": 9,
            "count": 299,
            "rate": 2.7,
            "date": "2006-09-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2006,
            "month": 10,
            "count": 275,
            "rate": 2.5,
            "date": "2006-10-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2006,
            "month": 11,
            "count": 257,
            "rate": 2.3,
            "date": "2006-11-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2006,
            "month": 12,
            "count": 287,
            "rate": 2.6,
            "date": "2006-12-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2007,
            "month": 1,
            "count": 376,
            "rate": 3.5,
            "date": "2007-01-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2007,
            "month": 2,
            "count": 300,
            "rate": 2.8,
            "date": "2007-02-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2007,
            "month": 3,
            "count": 311,
            "rate": 2.8,
            "date": "2007-03-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2007,
            "month": 4,
            "count": 240,
            "rate": 2.2,
            "date": "2007-04-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2007,
            "month": 5,
            "count": 276,
            "rate": 2.5,
            "date": "2007-05-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2007,
            "month": 6,
            "count": 258,
            "rate": 2.3,
            "date": "2007-06-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2007,
            "month": 7,
            "count": 324,
            "rate": 2.9,
            "date": "2007-07-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2007,
            "month": 8,
            "count": 315,
            "rate": 2.9,
            "date": "2007-08-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2007,
            "month": 9,
            "count": 304,
            "rate": 2.8,
            "date": "2007-09-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2007,
            "month": 10,
            "count": 338,
            "rate": 3.1,
            "date": "2007-10-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2007,
            "month": 11,
            "count": 336,
            "rate": 3.2,
            "date": "2007-11-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2007,
            "month": 12,
            "count": 326,
            "rate": 3.2,
            "date": "2007-12-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2008,
            "month": 1,
            "count": 338,
            "rate": 3.3,
            "date": "2008-01-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2008,
            "month": 2,
            "count": 340,
            "rate": 3.2,
            "date": "2008-02-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2008,
            "month": 3,
            "count": 346,
            "rate": 3.3,
            "date": "2008-03-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2008,
            "month": 4,
            "count": 338,
            "rate": 3.2,
            "date": "2008-04-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2008,
            "month": 5,
            "count": 366,
            "rate": 3.4,
            "date": "2008-05-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2008,
            "month": 6,
            "count": 364,
            "rate": 3.3,
            "date": "2008-06-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2008,
            "month": 7,
            "count": 345,
            "rate": 3.1,
            "date": "2008-07-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2008,
            "month": 8,
            "count": 378,
            "rate": 3.5,
            "date": "2008-08-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2008,
            "month": 9,
            "count": 414,
            "rate": 3.9,
            "date": "2008-09-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2008,
            "month": 10,
            "count": 396,
            "rate": 3.9,
            "date": "2008-10-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2008,
            "month": 11,
            "count": 411,
            "rate": 4.1,
            "date": "2008-11-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2008,
            "month": 12,
            "count": 559,
            "rate": 5.5,
            "date": "2008-12-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2009,
            "month": 1,
            "count": 659,
            "rate": 6.5,
            "date": "2009-01-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2009,
            "month": 2,
            "count": 586,
            "rate": 5.7,
            "date": "2009-02-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2009,
            "month": 3,
            "count": 625,
            "rate": 5.9,
            "date": "2009-03-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2009,
            "month": 4,
            "count": 488,
            "rate": 4.6,
            "date": "2009-04-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2009,
            "month": 5,
            "count": 530,
            "rate": 5,
            "date": "2009-05-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2009,
            "month": 6,
            "count": 472,
            "rate": 4.4,
            "date": "2009-06-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2009,
            "month": 7,
            "count": 552,
            "rate": 5.2,
            "date": "2009-07-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2009,
            "month": 8,
            "count": 569,
            "rate": 5.3,
            "date": "2009-08-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2009,
            "month": 9,
            "count": 636,
            "rate": 5.9,
            "date": "2009-09-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2009,
            "month": 10,
            "count": 610,
            "rate": 5.9,
            "date": "2009-10-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2009,
            "month": 11,
            "count": 592,
            "rate": 5.7,
            "date": "2009-11-01T07:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2009,
            "month": 12,
            "count": 609,
            "rate": 5.9,
            "date": "2009-12-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2010,
            "month": 1,
            "count": 730,
            "rate": 7.2,
            "date": "2010-01-01T08:00:00.000Z"
         },
         {
            "series": "Self-employed",
            "year": 2010,
            "month": 2,
            "count": 680,
            "rate": 6.5,
            "date": "2010-02-01T08:00:00.000Z"
         }
      ]

      const spec: VisualizationSpec = {
         "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
         "width": 300, "height": 200,
         "data": {
            "values": data,
         },
         "mark": "area",
         "encoding": {
            "x": {
               "timeUnit": "yearmonth", "field": "date",
               "axis": { "domain": false, "format": "%Y", "tickSize": 0 }
            },
            "y": {
               "aggregate": "sum", "field": "count",
               "axis": null,
               "stack": "center"
            },
            "color": { "field": "series", "scale": { "scheme": "category20b" } }
         }
      }
      return spec;
   }

   createVisualizationData() {
      console.log(this.state.chartData);

      const data = {
         "name": "table",
         "values": this.state.chartData,
         transform: [
            { "type": "flatten", "fields": ["buckets", "operators", "relativeFrquencies"] },
            { "type": "collect", "sort": { "field": "operators" } },
            { "type": "stack", "groupby": ["buckets"], "field": "relativeFrquencies" }
         ]
      };

      return data;
   }

   createVisualizationSpec() {
      const visData = this.createVisualizationData();

      const xTicks = () => {

         const bucketsArrayLength = this.state.chartData!.buckets.length;
         const numberOfTicks = 30;

         if (bucketsArrayLength > numberOfTicks) {

            let ticks = [];

            const delta = Math.floor(bucketsArrayLength / numberOfTicks);

            for (let i = 0; i < bucketsArrayLength; i = i + delta) {
               ticks.push(this.state.chartData!.buckets[i]);
            }
            return ticks;
         }

      }

      const spec: VisualizationSpec = {
         $schema: "https://vega.github.io/schema/vega/v5.json",
         width: this.state.width,
         height: this.state.height,
         padding: { left: 10, right: 10, top: 20, bottom: 20 },
         resize: true,
         autosize: 'fit',

         data: [
            visData
         ],

         scales: [
            {
               name: "x",
               type: "point",
               range: "width",
               domain: {
                  data: "table",
                  field: "buckets"
               }
            },
            {
               name: "y",
               type: "linear",
               range: "height",
               nice: true,
               zero: true,
               domain: [0, 1]
            },
            {
               name: "color",
               type: "ordinal",
               range: {
                  scheme: "tableau20",
               },
               domain: {
                  data: "table",
                  field: "operators"
               }
            }
         ],
         axes: [
            {
               orient: "bottom",
               scale: "x",
               zindex: 1,
               labelOverlap: true,
               values: xTicks()
            },
            {
               orient: "left",
               scale: "y",
               zindex: 1
            }
         ],
         marks: [
            {
               type: "group",
               from: {
                  facet: {
                     name: "series",
                     data: "table",
                     groupby: "operators"
                  }
               },
               marks: [
                  {
                     type: "area",
                     from: {
                        data: "series"
                     },
                     encode: {
                        enter: {
                           interpolate: {
                              value: this.state.interpolation,
                           },
                           x: {
                              scale: "x",
                              field: "buckets"
                           },
                           y: {
                              scale: "y",
                              field: "y0"
                           },
                           y2: {
                              scale: "y",
                              field: "y1"
                           },
                           fill: {
                              scale: "color",
                              field: "operators"
                           },
                           tooltip: {
                              "field": "buckets",
                           },

                        },
                        update: {
                           fillOpacity: {
                              value: 1
                           }
                        },
                        hover: {
                           fillOpacity: {
                              value: 0.5
                           }
                        }
                     }
                  }
               ]
            }
         ],
         legends: [{
            fill: "color",
            title: "Operators",
            orient: "right",
         }
         ],
      } as VisualizationSpec;

      return spec;
   }

}

const mapStateToProps = (state: model.AppState) => ({
   resultLoading: state.resultLoading,
   result: state.result,
   csvParsingFinished: state.csvParsingFinished,
   currentChart: state.currentChart,
   currentEvent: state.currentEvent,
   currentRequest: state.currentRequest,
   events: state.events,
   chartIdCounter: state.chartIdCounter,
   chartData: state.chartData,
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
});


export default connect(mapStateToProps, mapDispatchToProps)(withAppContext(SwimLanes));



