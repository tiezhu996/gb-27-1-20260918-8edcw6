"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveClassesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const live_class_entity_1 = require("../../common/entities/live-class.entity");
const live_classes_controller_1 = require("./live-classes.controller");
const live_classes_service_1 = require("./live-classes.service");
let LiveClassesModule = class LiveClassesModule {
};
exports.LiveClassesModule = LiveClassesModule;
exports.LiveClassesModule = LiveClassesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([live_class_entity_1.LiveClass])],
        controllers: [live_classes_controller_1.LiveClassesController],
        providers: [live_classes_service_1.LiveClassesService],
    })
], LiveClassesModule);
//# sourceMappingURL=live-classes.module.js.map