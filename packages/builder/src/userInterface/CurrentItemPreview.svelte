<script>
import { store } from "../builderStore";
import { makeLibraryUrl } from "../builderStore/loadComponentLibraries";
import {
    last,
    split,
    map,
    join
} from "lodash/fp";
import { pipe } from "../common/core";
import { splitName } from "./pagesParsing/splitRootComponentName"
import { afterUpdate } from 'svelte';

let component;
let stylesheetLinks = "";
let componentHtml = "";
let props;
let componentLibraryUrl = "";
let rootComponentName = "";
let iframe;

store.subscribe(s => {
    const {componentName, libName} = splitName(
        s.currentComponentInfo.rootComponent.name);

    rootComponentName = componentName;
    props = s.currentComponentInfo.fullProps;
    component = s.libraries[libName][componentName];
    stylesheetLinks = pipe(s.pages.stylesheets, [
        map(s => `<link rel="stylesheet" href="${s}"/>`),
        join("\n")
    ]);
    componentLibraryUrl = makeLibraryUrl(s.appname, libName);
});

/*
afterUpdate(() => {
    if(iframe) iframeLoaded();
});
*/

const iframeLoaded = () => {
    setTimeout(() => {
        iframe.style.height = (iframe.contentWindow.document.body.scrollHeight + 1).toString() + "px";
        iframe.style.width = (iframe.contentWindow.document.body.scrollWidth + 1).toString() + "px";
    }, 100);
}

</script>

<div class="component-preview" >
    <div class="component-container">
        <iframe bind:this={iframe}
                on:load={iframeLoaded}
                title="componentPreview"
                srcdoc={
`<html>
    
<head>
    ${stylesheetLinks}
    <script>
    
        import('${componentLibraryUrl}')
        .then(module => {
            const componentClass = module['${rootComponentName}'];
            const instance = new componentClass({
                target: document.body,
                props: JSON.parse('${JSON.stringify(props)}')
            }) ;
        })
        
    </script>
</head>
<body>
</body>
</html>`}>
        </iframe>
    </div>
</div>

<style>
.component-preview {
    display: grid;
    grid-template-rows: [top] 1fr [middle] auto [bottom] 1fr;
    grid-template-columns: [left] 1fr [middle] auto [right] 1fr;
    grid-column-start: preview;
    height:100%;
}

.component-container {
    grid-row-start: middle;
    grid-column-start: middle;
}

#comonent-container-mock {
    position:fixed;
    left: -2000px
}

</style>