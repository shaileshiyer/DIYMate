import { ChangeEvent, ChangeEventHandler, PropsWithChildren, useCallback, useState } from "react";
import classes from './textarea.module.css';

interface TextAreaProps {
    name?: string,
    placeholder?: string,
    value?: string|number|readonly string[],
    disabled?: boolean,
    onChange?: (event: ChangeEvent<HTMLTextAreaElement> | ChangeEvent<HTMLInputElement>) => void,
}
export default function TextArea(props: PropsWithChildren<TextAreaProps>) {
    const {
        children,
        name = "text-area",
        placeholder = "Write...",
        value = "",
        disabled = false,
        onChange = (evt) => { console.warn('OnChangeHandler not set')},
    } = props;
    const [tempValue, setTemporaryValue] = useState<string|number|readonly string[]>(value.toString().trimStart());

    const onChangeHandler = useCallback<ChangeEventHandler<HTMLTextAreaElement>>((evt) => {
        setTemporaryValue(evt.target.value);
        onChange(evt)
    }, [onChange])

    return (
        <textarea name={name} placeholder={placeholder} className={classes.textarea} value={tempValue} onChange={onChangeHandler} disabled={disabled}>{children}</textarea>
    );
}