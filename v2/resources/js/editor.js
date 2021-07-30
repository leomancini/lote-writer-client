const { EditorState } = require('prosemirror-state')
const { EditorView } = require('prosemirror-view')
const { DOMParser } = require('prosemirror-model')
const { Plugin } = require('prosemirror-state')

const { schema } = require('prosemirror-schema-basic')
const { exampleSetup } = require('prosemirror-example-setup')

let selectionSizePlugin = new Plugin({
    view(editorView) {
        return new SelectionSizeTooltip(editorView);
    }
});

class SelectionSizeTooltip {
    constructor(view) {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tooltip';

        this.tooltip.onclick = (click) => {
            let clickedAction = click.target;
            let clickedActionId = clickedAction.dataset.actionId;

            switch(clickedActionId) {
                case 'add-note':

                break;
                case 'add-to-flash-cards':

                break;
                case 'translate':
                    let myHeaders = new Headers();
                    myHeaders.append("Content-Type", "application/json");

                    let requestOptions = {
                        method: 'POST',
                        headers: myHeaders,
                        body: JSON.stringify({
                            "data": {
                                "text": window.lastSelectedText
                            }
                        })
                    };

                    fetch("http://localhost:3000/translate", requestOptions)
                        .then(response => response.json())
                        .then(result => {
                            console.log({
                                selection: window.lastSelectedText,
                                translated: result.data[0].translatedText
                            });
                        })
                        .catch(error => console.log('error', error));
                break;
            }

            this.tooltip.style.display = 'none';
            return;
        }

        view.dom.parentNode.appendChild(this.tooltip);

        this.update(view, null);
    }

    update(view, lastState) {
        let state = view.state;

        // Don't do anything if the document/selection didn't change
        if (lastState && lastState.doc.eq(state.doc) &&
        lastState.selection.eq(state.selection)) return

        // Hide the tooltip if the selection is empty
        if (state.selection.empty) {
            this.tooltip.style.display = 'none';
            return;
        }

        // Otherwise, reposition it and update its content
        this.tooltip.style.display = '';
        let {from, to} = state.selection;
        // These are in screen coordinates
        let start = view.coordsAtPos(from), end = view.coordsAtPos(to);
        // The box in which the tooltip is positioned, to use as base
        let box = this.tooltip.offsetParent.getBoundingClientRect();
        // Find a center-ish x position from the selection endpoints (when
        // crossing lines, end may be more to the left)
        let left = Math.max((start.left + end.left) / 2, start.left + 3);

        const tooltipActionsHolder = document.createElement('div');

        const tooltipActions = [
            {
                id: 'add-note'
            },
            {
                id: 'add-to-flash-cards'
            },
            {
                id: 'translate'
            }
        ];

        tooltipActions.forEach((action) => {
            const tooltipAction = document.createElement('div');
            tooltipAction.classList = `action ${action.id}`;
            tooltipAction.dataset.actionId = action.id;
            tooltipActionsHolder.appendChild(tooltipAction);
        });

        this.tooltip.style.left = (left - box.left) + 'px';
        this.tooltip.style.bottom = (box.bottom - start.top) + 'px';
        this.tooltip.innerHTML = tooltipActionsHolder.innerHTML;

        window.lastSelectedText = window.getSelection().toString();
    }

    destroy() {
        this.tooltip.remove();
    }
}

window.view = new EditorView(document.querySelector('#editor'), {
    state: EditorState.create({
        doc: DOMParser.fromSchema(schema).parse(document.querySelector('#content')),
        plugins: exampleSetup({ schema }).concat(selectionSizePlugin)
    })
});