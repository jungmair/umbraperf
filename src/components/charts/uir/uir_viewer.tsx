import * as model from '../../../model';
import * as Context from '../../../app_context';
import styles from '../../../style/charts.module.css';
import React from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import Editor from "@monaco-editor/react";
import Spinner from '../../utils/spinner';


interface AppstateProps {
    appContext: Context.IAppContext;
    chartData: model.IUirViewerData,
}

type Props = model.IUirViewerProps & AppstateProps;


class UirViewer extends React.Component<Props, {}> {


    constructor(props: Props) {
        super(props);

        this.handleEditorWillMount = this.handleEditorWillMount.bind(this);
    }

    public render() {
        return this.createMonacoEditor();
    }

    prepareUirLines() {
        return this.props.chartData.uirLines;
    }

    handleEditorDidMount(editor: any, monaco: any) {

    }

    handleEditorWillMount(monaco: any) {
        this.createMonacoCustomTheme(monaco);
    }

    createMonacoCustomTheme(monaco: any) {

        //Register new Language
        monaco.languages.register({ id: 'umbraIntermediateRepresentation' });
        // monaco.languages.setMonarchTokensProvider('umbraIntermediateRepresentation', definition());

        //Define Tokens:
        const tokens = {
            topLevelKeyword: {
                uirKeyword: /define|declare/,
                comments: /#.*/,
            },

            seconedLevelKeyword: {
                uirKeyword: /call|const|functionargument|functionvar|globalref|headerptrpair|unreachable|switch|return/,
                uirFunctionName: /@\w+/,
                uirName: /%\w+/,
                uirLabel: /^\w+:/,
            },

            thirdLevelKeyword: {
                operators: /\ add\ |\ sub\ |\ mul\ |\ sdiv\ |\ udiv\ |\ srem\ |\ urem\ |\ pow\ |\ shl\ |\ ashr\ |\ lshr\ |\ rotl\ |\ rotr\ |\ and\ |\ or\ |\ xor\ |\ saddoverflow\ |\ uaddoverflow\ |\ ssuboverflow\ |\ usuboverflow\ |\ smuloverflow\ |\ umuloverflow\ |\ overflowresult\ |\ crc32\ |\ not\ |\ neg\ |\ isnull\ |\ isnotnull\ |\ bswap\ |\ ctlz\ |\ cmpeq\ |\ cmpne\ |\ cmpslt\ |\ cmpsuolt\ |\ cmpult\ |\ cmpsle\ |\ cmpsuole\ |\ cmpule\ |\ zext\ |\ SExt\ |\ trunc\ |\ fptosi\ |\ sitofp\ |\ ptrtoint\ |\ inttoptr\ |\ builddata128\ |\ extractdata128\ |\ select\ |\ getelementptr\ |\ load\ |\ atomicload\ |\ store\ |\ atomicstore\ |\ atomicrmwadd\ |\ atomicrmwxchg\ |\ atomicrmwumax\ |\ atomiccmpxchg\ |\ phi\ |\ br\ |\ condbr\ |\ checkedsadd\ |\ checkedssub\ |\ checkedsmul\ /,
                datatypes: /int8|int16|int32|int64|uint8|uint16|uint32|uint64|i8|i16|i32|i64|ptr|d128|data128|void|object\s(\w|:)+ /,

            },

            fourthLevelKeyword: {
                uirString: /".*"/,
                uirNumber: /0x[a-zA-Z0-9]+/,
                //TODO further number in vim file?
            }

        }

        // Register a tokens provider for the language
        let tokenizerRoot: Array<[RegExp, string]> = [];
        for (let tokenLevelName in tokens) {
            const tokenLevel = (tokens as any)[tokenLevelName];
            for (let token in tokenLevel) {
                tokenizerRoot.push([(tokenLevel as any)[token], tokenLevelName]);
            }
        }
        monaco.languages.setMonarchTokensProvider('umbraIntermediateRepresentation', {
            tokenizer: {
                root: tokenizerRoot
                // [
                // [tokens.topLevelKeyword.uirKeyword, 'topLevelKeyword'],
                // [tokens.topLevelKeyword.comments, 'topLevelKeyword'],

                // [tokens.seconedLevelKeyword.uirKeyword, 'seconedLevelKeyword'],
                // [tokens.seconedLevelKeyword.uirFunctionName, 'seconedLevelKeyword'],

                // [tokens.thirdLevelKeyword.operators, 'thirdLevelKeyword'],
                // [tokens.thirdLevelKeyword.datatypes, 'thirdLevelKeyword'],
                // [ , 'occurrenceValue'],
                // ],
            }
        });

        // Define new Theme
        monaco.editor.defineTheme('customTheme', {
            base: 'vs',
            inherit: false,
            rules: [
                { token: 'topLevelKeyword', foreground: this.props.appContext.secondaryColor },
                { token: 'seconedLevelKeyword', foreground: this.props.appContext.accentDarkGreen },
                { token: 'thirdLevelKeyword', foreground: this.props.appContext.tertiaryColor },
                { token: 'fourthLevelKeyword', foreground: this.props.appContext.accentDarkBlue },

            ]
        });

    }

    createMonacoEditor() {

        const monacoDefaultValue = this.props.chartData.uirLines.join('');

        const monacoOptions = {
            readOnly: true,
            scrollBeyondLastLine: false,
            folding: true,
            foldingHighlight: true,
            // foldingStrategy: 'indentation' as "auto" | "indentation" | undefined,
        }

        const monacoEditor = <div
            className={styles.monacoEditorContainer}
        >
            <div className={styles.chartTitle}>UIR Profiler</div>

            <div className={styles.monacoEditor}>
                <Editor
                    key={this.props.key}
                    defaultLanguage="umbraIntermediateRepresentation"
                    theme={"customTheme"}
                    defaultValue={monacoDefaultValue}
                    options={monacoOptions}
                    loading={<Spinner />}
                    beforeMount={this.handleEditorWillMount}
                    onMount={this.handleEditorDidMount}
                />
            </div>
        </div>

        return monacoEditor;

    }

}

const mapStateToProps = (state: model.AppState, ownProps: model.IUirViewerProps) => ({
    chartData: state.chartData[ownProps.chartId].chartData.data as model.IUirViewerData,
});


export default connect(mapStateToProps, undefined)(Context.withAppContext(UirViewer));
