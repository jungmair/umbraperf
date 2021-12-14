import * as Context from '../../../app_context';
import styles from '../../../style/queryplan.module.css';
import React from 'react';
import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@material-ui/core';

export type QueryplanNodeTooltipData = {
    uirLines: Array<string>,
    uirLineNumber: Array<number>,
    eventOccurrences: Array<number>,
    totalEventOccurrence: number,
}

interface Props {
    appContext: Context.IAppContext;
    operatorName: string,
    operatorId: string,
    tooltipData: QueryplanNodeTooltipData,
}

class QueryPlanNodeTooltipContent extends React.Component<Props, {}> {


    constructor(props: Props) {
        super(props);
    }

    createContentTable() {

        const DenseTable = (tooltipData: QueryplanNodeTooltipData) => {

            function createData(lineNumber: number, uirLine: string, eventOccurrence: string) {
                return { lineNumber, uirLine, eventOccurrence };
            }

            function truncateUirLine(uirLine: string, length: number) {
                if (uirLine.length > length) {
                    return uirLine.substring(0, length - 1) + "...";
                } else {
                    return uirLine;
                }
            }

            let tableRows = [];
            for (let i = 0; i < 5; i++) {
                tableRows.push(createData(tooltipData.uirLineNumber[i], truncateUirLine(tooltipData.uirLines[i], 65), tooltipData.eventOccurrences[i] + "%"))
            }

            return (
                <Paper
                    className={styles.queryplanNodeTooltipTableBackground}
                >
                    <Table
                        size="small"
                        aria-label="a dense table">
                        <TableHead>
                            <TableRow>
                                <TableCell className={styles.queryplanNodeTooltipTableCellHead} align="right">No.</TableCell>
                                <TableCell className={styles.queryplanNodeTooltipTableCellHead} align="left">UIR Line</TableCell>
                                <TableCell className={styles.queryplanNodeTooltipTableCellHead} align="right">Freq.</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {tableRows.map((row) => (
                                <TableRow key={row.lineNumber}>
                                    <TableCell className={styles.queryplanNodeTooltipTableCell} component="td" align="right">
                                        <div className={styles.queryplanNodeTooltipTableCellContentUirNumber}>
                                            {row.lineNumber}
                                        </div>
                                    </TableCell>
                                    <TableCell className={styles.queryplanNodeTooltipTableCell} component="th" align="left" scope="row">
                                        <div className={styles.queryplanNodeTooltipTableCellContentUirLine}>
                                            {row.uirLine}
                                        </div>
                                    </TableCell>
                                    <TableCell className={styles.queryplanNodeTooltipTableCell} component="td" align="right">
                                        <div className={styles.queryplanNodeTooltipTableCellContentUirFreq}>
                                            {row.eventOccurrence}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            );
        }

        return DenseTable(this.props.tooltipData);
    }

    createTotalSumLine() {
        return <Typography
            className={styles.queryplanNodeTooltipSubtitle}
            variant="subtitle2"
        >
            Total Frequency: {this.props.tooltipData.totalEventOccurrence}%

        </Typography>
    }

    createHeaderOperatorName() {
        const showOperatorId = () => {
            return this.props.operatorName === this.props.operatorId ? "" : ` (${this.props.operatorId})`;
        }

        return <Typography
            className={styles.queryplanNodeTooltipHeader}
            variant="subtitle2"
        >
            {this.props.operatorName} {showOperatorId()}

        </Typography>
    }

    createNodeTooltip() {
        return <div>
            {this.createHeaderOperatorName()}
            {this.createContentTable()}
            {this.createTotalSumLine()}
        </div >
    }

    public render() {
        return this.createNodeTooltip();
    }

}

export default (Context.withAppContext(QueryPlanNodeTooltipContent));
