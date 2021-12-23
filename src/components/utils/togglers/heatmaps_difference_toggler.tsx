import * as model from '../../../model';
import * as Controller from '../../../controller';
import * as Context from '../../../app_context';
import React from 'react';
import { connect } from 'react-redux';
import { FormControl, FormControlLabel, Switch, Typography } from '@material-ui/core';
import styles from '../../../style/utils.module.css';


interface Props {
    appContext: Context.IAppContext;
    memoryHeatmapsDifferenceRepresentation: boolean,
    setMemoryHeatmapsDifferenceRepresentation: (newMemoryHeatmapsDifferenceRepresentation: boolean) => void;
}

function HeatmapsDiffToggler(props: Props) {

    const handleHeatmapsDiffTogglerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        props.setMemoryHeatmapsDifferenceRepresentation(event.target.checked);
        Controller.resetSelectionHeatmapsOutlierDetectionSelection();
    }

    return (
        <div className={styles.heatmapsOption}>
            <FormControl
                component="fieldset"
                variant="standard"
            >

                <FormControlLabel
                    className={styles.formControlLabel}
                    control={
                        <Switch
                            checked={props.memoryHeatmapsDifferenceRepresentation}
                            onChange={handleHeatmapsDiffTogglerChange}
                            name="HeatmapsDiffToggler"
                            size="small"
                        />
                    }
                    label={
                        <Typography
                            className={styles.togglerLabel}
                            variant="caption"
                        >
                            Show Memory Access Differences:
                        </Typography>
                    }
                    labelPlacement="start"
                />
            </FormControl>
        </div>
    );
}

const mapStateToProps = (state: model.AppState) => ({
    memoryHeatmapsDifferenceRepresentation: state.memoryHeatmapsDifferenceRepresentation,
});

const mapDispatchToProps = (dispatch: model.Dispatch) => ({
    setMemoryHeatmapsDifferenceRepresentation: (newMemoryHeatmapsDifferenceRepresentation: boolean) => dispatch({
        type: model.StateMutationType.SET_MEMORY_HEATMAPS_DIFFERENCE_REPRESENTATION,
        data: newMemoryHeatmapsDifferenceRepresentation,
    }),

});

export default connect(mapStateToProps, mapDispatchToProps)(Context.withAppContext(HeatmapsDiffToggler));