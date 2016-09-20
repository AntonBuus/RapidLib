/* globals Module */

"use strict";

var rapidMix = {};

//rapidMix namespace

rapidMix.VectorInt = Module.VectorInt;
rapidMix.VectorDouble = Module.VectorDouble;
rapidMix.TrainingExample = Module.TrainingExample;
rapidMix.TrainingSet = Module.TrainingSet;

rapidMix.KnnClassification = Module.KnnClassification;
rapidMix.NeuralNetwork = Module.NeuralNetwork;


rapidMix.ModelSet = function() {
    console.log("creating model set");
    this.myModelSet = [];
};

rapidMix.ModelSet.prototype.loadJSON = function (url) {
    var that = this;
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "json";
    request.onload = function () {
        //console.log("loaded", JSON.stringify(this.response));
        var modelSet = this.response;
        var allInputs = modelSet.metadata.inputNames;
        modelSet.modelSet.forEach(function (value) {
            var numInputs = value.numInputs;
            var whichInputs = new rapidMix.VectorInt();
            switch (value.modelType) {
                case 'kNN classification':
                    var neighbours = new rapidMix.TrainingSet();
                    var numExamples = value.numExamples;
                    var k = value.k;
                    var numClasses = value.numClasses;

                    for (var i = 0; i < allInputs.length; ++i) {
                        if (value.inputNames.includes(allInputs[i])) {
                            whichInputs.push_back(i);
                        }
                    }

                    var myKnn = new rapidMix.KnnClassification(numInputs, whichInputs, neighbours, k);
                    value.examples.forEach(function (value) {
                        var features = new rapidMix.VectorDouble();
                        for (var i = 0; i < numInputs; ++i) {
                            features.push_back(parseFloat(value.features[i]));
                        }
                        myKnn.addNeighbour(parseInt(value.class), features);
                    });
                    that.addkNNModel(myKnn);
                    break;
                case 'Neural Network':
                    var numLayers = value.numHiddenLayers;
                    var numNodes = value.numHiddenNodes;
                    var weights = new rapidMix.VectorDouble();
                    var wHiddenOutput = new rapidMix.VectorDouble();
                    var inMax = new rapidMix.VectorDouble();
                    var inMin = new rapidMix.VectorDouble();
                    var outMax = value.outMax;
                    var outMin = value.outMin;

                    var localWhichInputs = [];
                    for (var i = 0; i < allInputs.length; ++i) {
                        //console.log('allInputs[', i, '] = ', allInputs[i]);
                        //console.log(value.inputNames);
                        if (value.inputNames.includes(allInputs[i])) {
                            whichInputs.push_back(i);
                            localWhichInputs.push(i);
                        }
                    }

                    var currentLayer = 0;
                    value.nodes.forEach(function (value, i) {
                        if (value.name === 'Linear Node 0') { //Output Node
                            for (var j = 1; j <= numNodes; ++j) {
                                var whichNode = 'Node ' + (j + (numNodes * (numLayers - 1)));
                                wHiddenOutput.push_back(parseFloat(value[whichNode]));
                                //console.log("pushing output ", value[whichNode]);
                            }
                            wHiddenOutput.push_back(parseFloat(value.Threshold));
                        } else {
                            currentLayer = Math.floor((i - 1) / numNodes);
                            if (currentLayer < 1) { //Nodes connected to input
                                for (var j = 0; j < numInputs; ++j) {
                                    //console.log('j ', j, 'whichInputs ', localWhichInputs[j]);
                                    //console.log("pushing", value['Attrib ' + allInputs[j]]);
                                    weights.push_back(parseFloat(value['Attrib ' + allInputs[localWhichInputs[j]]]));
                                }
                            } else { //Hidden Layers
                                for (var j = 1; j <= numNodes; ++j) {
                                    weights.push_back(parseFloat(value['Node ' + (j + (numNodes * (currentLayer - 1)))]));
                                }
                            }
                            weights.push_back(parseFloat(value.Threshold));
                        }
                    });

                    for(var j = 0; j < numInputs; ++j) {
                        inMin.push_back(value.inMins[j]);
                        inMax.push_back(value.inMaxes[j]);
                    }

                    var myNN = new rapidMix.NeuralNetwork(numInputs, whichInputs, numLayers, numNodes, weights, wHiddenOutput, inMax, inMin, outMax, outMin);
                    that.addNNModel(myNN);
                    break;
                default:
                    console.warn('unknown model type ', value.modelType);
                    break;
            }
        });
    };
    request.send(null);
};

rapidMix.ModelSet.prototype.addNNModel = function (model) {
    console.log('Adding NN model');
    this.myModelSet.push(model);
};

rapidMix.ModelSet.prototype.addkNNModel = function (model) {
    console.log('Adding kNN model');
    this.myModelSet.push(model);
};

rapidMix.ModelSet.prototype.process = function (input) {
    var modelSetInput = new rapidMix.VectorDouble();
    for (var i = 0; i < input.length; ++i) {
        modelSetInput.push_back(input[i]);
    }
    var output = [];
    //noinspection JSDuplicatedDeclaration
    for (var i = 0; i < this.myModelSet.length; ++i) {
        output.push(this.myModelSet[i].processInput(modelSetInput));
    }
     return output;
};
