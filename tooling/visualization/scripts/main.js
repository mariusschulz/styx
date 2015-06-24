/* global $ */
/* global ko */

(function() {
    var visualization = document.getElementById("visualization");
    var container = document.getElementById("graph");
    
    var sessionStorageKeys = {
        code: "code",
        options: "options",
        selectedTabId: "selectedTabId"
    };
    
    var mainTabId = 0;
    var viewModel = {
        selectedFunctionId: ko.observable(mainTabId),
        functions: ko.observableArray([]),
        program: ko.observable(),
        error: ko.observable(null),
        
        passes: {
            removeTransitNodes: ko.observable(true),
            rewriteConstantConditionalEdges: ko.observable(true)
        },
        
        selectTab: function(tabId) {
            viewModel.selectedFunctionId(tabId);
        },
        
        selectMainTab: function() {
            viewModel.selectTab(mainTabId);
        }
    };
    
    viewModel.options = ko.computed(function() {
        return {
            passes: {
                removeTransitNodes: viewModel.passes.removeTransitNodes(),
                rewriteConstantConditionalEdges: viewModel.passes.rewriteConstantConditionalEdges()
            }
        };
    });
    
    viewModel.actualFunctionId = ko.computed(function() {
        var functionId = viewModel.selectedFunctionId();
        var functions = viewModel.functions();
        
        var selectedFunction = _.findWhere(functions, { id: functionId });
        
        if (!selectedFunction) {
            viewModel.selectedFunctionId(mainTabId);
            return mainTabId;
        }
        
        return functionId;
    });
    
    viewModel.isTabActive = function(tabId) {
        return viewModel.actualFunctionId() === tabId;
    };
       
    viewModel.isMainTabActive = ko.computed(function() {
        return viewModel.isTabActive(mainTabId);
    });
    
    var previousCode;    
    var debouncedParseAndVisualize = _.debounce(parseAndVisualize, 200);
    
    var $input = $("#input")
        .on("keydown", keydown)
        .on("keyup", keyup);
    
    initializeFormFromSessionStorage();
    parseAndVisualize();
    
    viewModel.options.subscribe(parseAndVisualize);    
    viewModel.actualFunctionId.subscribe(function(tabId) {
        visualizeFlowGraph();
        sessionStorage.setItem(sessionStorageKeys.selectedTabId, tabId);
    });
    
    ko.applyBindings(viewModel, visualization);
    
    var selectedTabId = +sessionStorage.getItem(sessionStorageKeys.selectedTabId) || 0;
    viewModel.selectTab(selectedTabId);
    
    function parseAndVisualize() {
        parseProgram();
        visualizeFlowGraph();
    }
    
    function parseProgram() {
        var code = $input.val();
        var options = viewModel.options();
        
        previousCode = code;
        
        sessionStorage.setItem(sessionStorageKeys.code, code);
        sessionStorage.setItem(sessionStorageKeys.options, JSON.stringify(options));
        
        try {
            viewModel.error(null);
        
            var program = window.cfgVisualization.parseProgram(code, options);
            viewModel.program(program);
            
            var functions = _(program.functions)
                .map(function(f) { return _.pick(f, "id", "name"); })
                .sortBy("name")
                .value();
            
            viewModel.functions(functions);
        } catch (e) {
            viewModel.error(e);
        }
    }
    
    function visualizeFlowGraph() {
        var functionId = viewModel.actualFunctionId();
        var program = viewModel.program();
        
        var selectedFunction = _.findWhere(program.functions, { id: functionId });
        var flowGraph = selectedFunction
            ? selectedFunction.flowGraph
            : program.flowGraph;
        
        window.cfgVisualization.renderControlFlowGraph(container, flowGraph);
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
            debouncedParseAndVisualize();
        }
    }
    
    function initializeFormFromSessionStorage() {
        var code = sessionStorage.getItem(sessionStorageKeys.code) || "";
        $input.val(code);
        
        var optionsString = sessionStorage.getItem(sessionStorageKeys.options);
        
        if (optionsString) {
            var options = JSON.parse(optionsString) || {};
            var passes = options.passes || {};
            
            viewModel.passes.removeTransitNodes(passes.removeTransitNodes);
            viewModel.passes.rewriteConstantConditionalEdges(passes.rewriteConstantConditionalEdges);            
        } else {
            viewModel.passes.removeTransitNodes(true);
            viewModel.passes.rewriteConstantConditionalEdges(true);
        }
    }
}());
