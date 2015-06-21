/// <reference path="../../definitions/knockout.d.ts" />

(function() {
    var visualization = document.getElementById("visualization");
    var container = document.getElementById("graph");
    
    var mainTabId = 0;
    var viewModel = {
        activeTabId: ko.observable(),
        functions: ko.observableArray([]),
        
        passes: {
            removeTransitNodes: ko.observable(true),
            rewriteConstantConditionalEdges: ko.observable(true)
        },
        
        selectTab: function(tabId) {
            viewModel.activeTabId(tabId);
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
    
    viewModel.isTabActive = function(tabName) {
        return viewModel.activeTabId() === tabName;
    };
       
    viewModel.isMainTabActive = ko.computed(function() {
        return viewModel.isTabActive(mainTabId);
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
    
    viewModel.activeTabId.subscribe(function(tabName) {
        update();
    });
    
    viewModel.selectMainTab();
    
    ko.applyBindings(viewModel, visualization);
    
    function update() {
        var activeTabId = viewModel.activeTabId();
        var code = $input.val();
        var options = viewModel.options();
        
        previousCode = code;
        
        sessionStorage.setItem(sessionStorageKeys.code, code);
        sessionStorage.setItem(sessionStorageKeys.options, JSON.stringify(options));
        
        var controlFlowGraph = window.cfgVisualization.computeControlFlowGraph(code, options, activeTabId);
        window.cfgVisualization.renderControlFlowGraph(container, controlFlowGraph);
        
        if (activeTabId === mainTabId) {
            var functions = _(controlFlowGraph.functions)
                .map(function(f) { return _.pick(f, "id", "name"); })
                .sortBy("name")
                .value();
            
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
