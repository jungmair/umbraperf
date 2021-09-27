import * as model from '../../model';
import React from 'react';
import MenuItem from '@material-ui/core/MenuItem';
import { InputLabel, Select } from '@material-ui/core';
import styles from "../../style/utils.module.css";
import { connect } from 'react-redux';


interface Props{
    currentBucketSize: number;
    setCurrentBucketSize: (newCurrentBucketSize: number) => void;
}

function BucketsizeDropdwn(props: Props) {

    const bucketsizes = [0.1, 0.2, 0.5, 0.7, 1, 2.5, 5, 7.5, 10, 50, 100];

    const handleOnItemClick = (elem: number) => {
        props.setCurrentBucketSize(elem);
    };


    return (
        <div className={styles.bucketsizeDropdownSelectorContainer}>
            <InputLabel className={styles.bucketsizeDropdownSelectorLabel} id="bucketsize-selector-label">Bucket-Size:</InputLabel>
            <Select className={styles.bucketsizeDropdownSelector}
                labelId="bucketsize-selector-label"
                id="bucketsize-selector"
                value={props.currentBucketSize}
            >
                {bucketsizes.map((elem, index) =>
                    (<MenuItem onClick={() => handleOnItemClick(elem)} key={index} value={elem}>{elem}</MenuItem>)
                )}
            </Select>

        </div>
    );
}

const mapStateToProps = (state: model.AppState) => ({
    currentBucketSize: state.currentBucketSize,
 });
 
 const mapDispatchToProps = (dispatch: model.Dispatch) => ({
    setCurrentBucketSize: (newCurrentBucketSize: number) => dispatch({
       type: model.StateMutationType.SET_CURRENTBUCKETSIZE,
       data: newCurrentBucketSize,
    }),
 });

export default connect(mapStateToProps, mapDispatchToProps)(BucketsizeDropdwn);