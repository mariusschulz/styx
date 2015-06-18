/// <reference path="../../definitions/knockout.d.ts" />

(function() {
    var visualization = document.getElementById("visualization");
    var container = document.getElementById("graph");
    
    var mainTabName = "<main>";
    var viewModel = {
        activeTab: ko.observable(),
        functions: ko.observableArray([]),
        
        passes: {
            removeTransitNodes: ko.observable(true),
            rewriteConstantConditionalEdges: ko.observable(true)
        },
        
        selectTab: function(tabName) {
            this.activeTab(tabName);
        },
        
        selectMainTab: function() {
            this.selectTab(mainTabName);
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
    
    viewModel.isTabActive = function(tabName) {
        return viewModel.activeTab() === tabName;
    };
       
    viewModel.isMainTabActive = ko.computed(function() {
        return viewModel.isTabActive(mainTabName);
    });
    
    var sessionStorageKeys = {
        code: "code",
        options: "options"
    };
    
    var previousCode;    
    var debouncedUpdate = _.debounce(update, 200);
    
    var $input = $("#input")
        .on("keydown", keydown)
        .on("keyup", keyup);
    
    initializeFormFromSessionStorage();
    
    viewModel.options.subscribe(function(options) {
        update();
    });
    
    viewModel.activeTab.subscribe(function(tabName) {
        update();
    });
    
    viewModel.selectMainTab();
    
    ko.applyBindings(viewModel, visualization);
    
    function update() {
        var activeTab = viewModel.activeTab();
        var code = $input.val();
        var options = viewModel.options();
        
        previousCode = code;
        
        sessionStorage.setItem(sessionStorageKeys.code, code);
        sessionStorage.setItem(sessionStorageKeys.options, JSON.stringify(options));
        
        var controlFlowGraph = window.cfgVisualization.computeControlFlowGraph(code, options, activeTab);
        window.cfgVisualization.renderControlFlowGraph(container, controlFlowGraph);
        
        if (activeTab === mainTabName) {
            var functions = _.map(controlFlowGraph.functions, function(f) { return _.pick(f, "name"); });
            viewModel.functions(functions);
        }
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
        var code = sessionStorage.getItem(sessionStorageKeys.code) || "";
        $input.val(code);
        
        var optionsString = sessionStorage.getItem(sessionStorageKeys.options) || "";
        var options = JSON.parse(optionsString);
        
        viewModel.passes.removeTransitNodes(!!options.passes.removeTransitNodes);
        viewModel.passes.rewriteConstantConditionalEdges(!!options.passes.rewriteConstantConditionalEdges);
    }
}());
