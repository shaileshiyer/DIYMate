import {css} from 'lit';

export default function litCssPlugin(){
    return{
        name: 'lit-css-transformer',
        transform(source,id){
            if(!id.endsWith('.css')){
                return;
            }
            
            return {
                code:source,
                map:null,
            };
        }
    }
}