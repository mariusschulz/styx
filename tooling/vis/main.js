(function() {
    var container = $("#graph")[0];    
    var $input = $("#input");    
    var $removeTransitNodesCheckbox = $("#transit-node-removal-pass");
    var $rewriteConstantConditionalEdgesCheckbox = $("#constant-conditional-edge-rewriting-pass");
    
    var previousCode;
    
    var debouncedUpdate = _.debounce(update, 200);
    
    $input.on("keydown", keydown);
    $input.on("keyup", keyup);
    
    $removeTransitNodesCheckbox.on("change", update);
    $rewriteConstantConditionalEdgesCheckbox.on("change", update);
    
    initializeFormFromSessionStorage();
    
    function update() {
        var code = $input.val();
        var options = {
            passes: {
                removeTransitNodes: $removeTransitNodesCheckbox.is(":checked"),
                rewriteConstantConditionalEdges: $rewriteConstantConditionalEdgesCheckbox.is(":checked")
            }
        };
        
        previousCode = code;
        
        sessionStorage.setItem("code", code);
        sessionStorage.setItem("options", JSON.stringify(options));
        
        window.cfgVisualization.renderControlFlowGraph(container, code, options);
    }
    
    function keydown(e) {
        if (e.keyCode === 9 /* tab */) {
            e.preventDefault();
            
            var cursorPos = $input.prop("selectionStart");
            var input = $input.val();
            var textBefore = input.substring(0, cursorPos);
            var textAfter  = input.substring(cursorPos, input.length);
            
            $input.val(textBefore + "    " + textAfter);
            $input.setCaretPosition(cursorPos + 4);
        }
    }
    
    function keyup() {
        if ($input.val() !== previousCode) {
            debouncedUpdate();
        }
    }
    
    function initializeFormFromSessionStorage() {
        $input.val(sessionStorage.getItem("code"));
        
        var optionsString = sessionStorage.getItem("options") || "";
        var options = JSON.parse(optionsString);
        
        $removeTransitNodesCheckbox.prop("checked", !!options.passes.removeTransitNodes);
        $rewriteConstantConditionalEdgesCheckbox.prop("checked", !!options.passes.rewriteConstantConditionalEdges);
        
        update();
    }
}());
