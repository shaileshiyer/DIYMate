import '@mdxeditor/editor/style.css';

import { MouseEventHandler, useCallback, useRef, useState } from "react";
import TextArea from "../components/TextArea";
import { MdFilledButton } from "../components/material";

import { MDXEditor, MDXEditorMethods, codeBlockPlugin, codeMirrorPlugin } from '@mdxeditor/editor';

export default function NewDIY() {
    const [description, setDescription] = useState<string>('');

    const outlineGenerationPrompt: string =
        `Generate a DIY tutorial outline with image suggestions in the following JSON format:
    \`\`\`JSON
    {
    "title": "Title of the DIY Project",
    "heroshot_alt_text": "Alternate text for the hero shot",
    "introduction": "Introduction to the DIY Project",
    "materials":["material 1","material 2"],
    "tools":["tool 1","tool 2"],
    "competences":["competence 1","competences 2"],
    "safety instruction":["safety 1","safety 2","safety 3"],
    "steps":[
        {
        "index": 0,
        "title": "step title",
        "image_alt_text":"Alternate text for image for this step.",
        "materials_in_step":["material 1","material 2"],
        "tools_in_step":["tool 1","tool 2"],
        "instructions":["instruction 1","instruction 2"]
        },
        {
        "index": 1,
        "title": "step title",
        "image_alt_text":"Alternate text for image for this step.",
        "materials_in_step":["material 1","material 2"],
        "tools_in_step":["tool 1","tool 2"],
        "instructions":["instruction 1","instruction 2"]
        }],
        "conclusion":{
        "final_image_alt_text":"Alternate text for final image",
        "text":"Summarize the DIY tutorial"
        }
    }
    \`\`\`
    `

    const outlinePromptEditorRef = useRef<MDXEditorMethods>(null);
    // const [promptText, setPromptText] = useState<string>(outlineGenerationPrompt);

    const onGenerateOutline = useCallback<MouseEventHandler>(() => {
        console.debug(description);
        console.debug(outlinePromptEditorRef.current?.getMarkdown());
    }, [description])

    return (
        <div id="new-diy">
            <div>
                <h1>Start a new DIY Tutorial</h1>
                <p>Write a short description of your DIY tutorial:</p>
                <TextArea
                    name="diy-description"
                    placeholder="Describe your DIY tutorial in 200-250 words..."
                    value={description}
                    onChange={(evt) => setDescription(evt.target.value)}
                ></TextArea>
                <p>Prompt to create a basic outline for the DIY Tutorial:</p>
                {/* <TextArea
                    name="outline-prompt"
                    // placeholder="Describe your DIY tutorial in 200-250 words..."
                    value={promptText}
                    onChange={(evt)=> setPromptText(evt.target.value)}
                ></TextArea> */}

                <MDXEditor
                    className='outline-prompt'
                    markdown={outlineGenerationPrompt}
                    ref={outlinePromptEditorRef}
                    plugins={[
                        codeBlockPlugin({ defaultCodeBlockLanguage: 'json' }),
                        codeMirrorPlugin({ codeBlockLanguages: { JSON: 'JSON' } })
                    ]} />

                <MdFilledButton onClick={onGenerateOutline} >Generate Outline</MdFilledButton>
            </div>
        </div>
    );
}