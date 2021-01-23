function setCaretPosition(params) {
    const field = params.field;

    if (params.position === 'END') {
        if (field.innerText.length > 0) {
            const range = document.createRange();
            const selection = window.getSelection();
            
            range.setStart(field.childNodes[0], field.innerText.length);
            range.collapse(true);
            
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    removeTextAccessory();
}

function getSelectionData(field) {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);

    const selectionData = {
        field,
        start: range.startOffset,
        end: range.endOffset,
        isTextSelected: range.startOffset !== range.endOffset,
        value: selection.toString(),
        boundingClientRect: selection.getRangeAt(0).getBoundingClientRect()
    };

    return selectionData;
}

function renderTextAccessory(selectionData) {
    removeTextAccessory();

    const textAccessory = document.createElement('div');
    textAccessory.classList = 'textAccessory';

    const textAccessoryOptions = [
        {
            title: 'CORRECT'
        },
        {
            title: 'ADD TRANSLATION'
        },
        {
            title: 'SOMETHING ELSE'
        }
    ];

    const textAccessoryOptionDimensions = {
        width: 50
    };

    const textAccessoryDimensions = {
        width: textAccessoryOptions.length * textAccessoryOptionDimensions.width,
        height: 50
    };

    const textAccessoryPosition = {
        left: selectionData.boundingClientRect.left
                + (selectionData.boundingClientRect.width / 2)
                - (textAccessoryDimensions.width / 2),
        top: selectionData.field.closest('.lineWrapper').offsetHeight
    }

    textAccessory.style.width = `${textAccessoryDimensions.width}px`;
    textAccessory.style.height = `${textAccessoryDimensions.height}px`;

    textAccessory.style.left = `${textAccessoryPosition.left}px`;
    textAccessory.style.top = `${textAccessoryPosition.top}px`;

    textAccessoryOptions.map((textAccessoryOption) => {
        const textAccessoryOptionElement = document.createElement('div');
        textAccessoryOptionElement.classList = 'textAccessoryOption';
        textAccessoryOptionElement.style.width = `${textAccessoryOptionDimensions.width}px`

        const textAccessoryOptionIcon = document.createElement('div');
        textAccessoryOptionIcon.classList = 'textAccessoryOptionIcon';

        textAccessoryOptionElement.onclick = (click) => {
            console.log(textAccessoryOption.title);
            removeTextAccessory();
        }

        textAccessoryOptionElement.appendChild(textAccessoryOptionIcon);
        textAccessory.appendChild(textAccessoryOptionElement);
    });

    selectionData.field.closest('.lineWrapper').appendChild(textAccessory);
}

function removeTextAccessory() {
    if (document.querySelector('.textAccessory')) {
        document.querySelector('.textAccessory').remove();
    }
}

function removeSelectionBackground(selectionData) {
    if(selectionData.field.closest('.lineWrapper').querySelector('.selectionBackground')) {
        selectionData.field.closest('.lineWrapper').querySelector('.selectionBackground').remove();
    }
}

function drawSelectionBackground(selectionData) {
    removeSelectionBackground(selectionData);
    
    const selectionBackground = document.createElement('div');
    selectionBackground.classList = 'selectionBackground';

    selectionBackground.style.width = `${selectionData.boundingClientRect.width}px`;
    selectionBackground.style.height = `${selectionData.boundingClientRect.height}px`;

    selectionBackground.style.left = `${selectionData.boundingClientRect.left}px`;

    selectionData.field.closest('.lineWrapper').appendChild(selectionBackground);
}

function insertlineInput(params) {
    const parentPageElement = params.parentPageElement;

    const lineWrapperElement = document.createElement('div');
    lineWrapperElement.classList = 'lineWrapper';

    const lineBackgroundElement = document.createElement('div');
    lineBackgroundElement.classList = 'lineBackground';

    const lineInput = document.createElement('div');
    lineInput.setAttribute('contenteditable', true);
    lineInput.classList = 'lineInput';

    lineInput.onkeyup = (keyup) => {
        if (lineInput.innerText !== '') {
            lineWrapperElement.classList.add('filled');
        }
    }

    lineInput.onkeydown = (keydown) => {
        const selection = getSelectionData(lineInput);

        removeTextAccessory();
        
        if (keydown.key === 'Enter') {
            keydown.preventDefault();
            const delayToInsertlineInput = 100; // This is mostly to give time for the macOS IME window to clear

            setTimeout(function() {
                insertlineInput({
                    parentPageElement: params.parentPageElement,
                    position: {
                        after: lineWrapperElement
                    }
                });
            }, delayToInsertlineInput);
        } else if (keydown.key === 'Backspace') {
            if (lineInput.innerText === '' || selection.start === 0) {
                if (lineWrapperElement.previousElementSibling) {
                    const previousLineInput = lineWrapperElement.previousElementSibling.querySelector('.lineInput');

                    previousLineInput.focus();

                    if (previousLineInput.innerText !== '') {
                        keydown.preventDefault();

                        setCaretPosition({
                            field: previousLineInput,
                            position: 'END'
                        });
                    }
                }
                
                if (parentPageElement.dataset.numberOfLines > 1) {
                    lineWrapperElement.remove();
                    parentPageElement.dataset.numberOfLines--;
                }
            }
        } else if (keydown.key === 'ArrowUp') {
            if (lineWrapperElement.previousElementSibling) {
                lineWrapperElement.previousElementSibling.querySelector('.lineInput').focus();
            }
        } else if (keydown.key === 'ArrowDown') {
            if (lineWrapperElement.nextElementSibling) {
                lineWrapperElement.nextElementSibling.querySelector('.lineInput').focus();
            }
        }
    }

    lineInput.onblur = (blur) => {
        blur.preventDefault();
    }

    lineWrapperElement.onmouseup = (mouseup) => {
        const selectionData = getSelectionData(lineInput);

        if (selectionData.isTextSelected) {
            console.log(selectionData);
            renderTextAccessory(selectionData);
        } else {
            if (!mouseup.target.classList.contains('textAccessoryOptionIcon')) {
                removeTextAccessory();
            }
        }
    }

    lineBackgroundElement.onclick = (click) => {
        lineInput.focus();
        
        if (click.clientX > lineInput.offsetLeft + lineInput.offsetWidth) {
            setCaretPosition({
                field: lineInput,
                position: 'END'
            });
        }
    }
    
    const translationLineInput = document.createElement('div');
    translationLineInput.setAttribute('contenteditable', true);
    translationLineInput.classList = 'translationLineInput';
    translationLineInput.setAttribute('placeholder', 'Add translation');

    translationLineInput.onkeydown = (keydown) => {
        if (translationLineInput.innerText !== '') {
            translationLineInput.classList.add('filled');
        }
    }

    lineWrapperElement.appendChild(lineInput);
    lineWrapperElement.appendChild(translationLineInput);
    lineWrapperElement.appendChild(lineBackgroundElement);

    if (params.position === 'END') {
        parentPageElement.appendChild(lineWrapperElement);
    } else if (typeof(params.position) === 'object') {
        if (params.position.after) {
            params.position.after.parentNode.insertBefore(lineWrapperElement, params.position.after.nextSibling);
        }
    }

    parentPageElement.dataset.numberOfLines++;
    
    lineInput.focus();
}
