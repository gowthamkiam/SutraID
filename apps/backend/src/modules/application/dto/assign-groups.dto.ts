import { IsArray, IsUUID } from 'class-validator';

export class AssignGroupsDto {
  @IsArray()
  @IsUUID(4, { each: true })
  groupIds: string[];
}
