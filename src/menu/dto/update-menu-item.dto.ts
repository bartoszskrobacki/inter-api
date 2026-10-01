import { PartialType } from '@nestjs/mapped-types';
import { MenuItemDto } from './create-menu-category.dto';

export class UpdateMenuItemDto extends PartialType(MenuItemDto) {}
