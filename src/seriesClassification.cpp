//
//  seriesClassification.cpp
//  RapidAPI
//
//  Created by mzed on 08/06/2017.
//  Copyright © 2017 Goldsmiths. All rights reserved.
//

#include <vector>
#include "seriesClassification.h"
#ifdef EMSCRIPTEN
#include "emscripten/seriesClassificationEmbindings.h"
#endif

seriesClassification::seriesClassification() {};

seriesClassification::~seriesClassification() {};

bool seriesClassification::addSeries(std::vector<std::vector<double>> newSeries) {
    dtw newDTW;
    newDTW.setSeries(newSeries);
    dtwClassifiers.push_back(newDTW);
    return true;
}

bool seriesClassification::addTrainingSet(const std::vector<trainingExample> &trainingSet) {
    std::vector<std::vector<double>> newSeries;
    for (int i = 0; i < trainingSet.size(); ++i) {
        newSeries.push_back(trainingSet[i].input);
    }
    return addSeries(newSeries);
};

void seriesClassification::reset() {
    dtwClassifiers.clear();
}


int seriesClassification::run(std::vector<std::vector<double>> inputSeries) {
    //TODO: check vector sizes and reject bad data
    int closestSeries = 0;
    double lowestCost = dtwClassifiers[0].run(inputSeries);
    for (int i = 0; i < dtwClassifiers.size(); ++i) {
        
        double currentCost = dtwClassifiers[i].run(inputSeries);
        if (currentCost < lowestCost) {
            lowestCost = currentCost;
            closestSeries = i;
        }
    }
    
    return closestSeries;
};

int seriesClassification::runTrainingSet(const std::vector<trainingExample> &trainingSet) {
    std::vector<std::vector<double>> newSeries;
    for (int i = 0; i < trainingSet.size(); ++i) {
        newSeries.push_back(trainingSet[i].input);
    }
    return run(newSeries);
};