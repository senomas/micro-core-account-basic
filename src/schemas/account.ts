import { MinLength } from "class-validator";
import { Field, InputType, ObjectType } from "type-graphql";

@ObjectType()
export class Account {
  @Field()
  public cif: string;
  
  @Field()
  public name: string;
}

@ObjectType()
export class Saving {
  @Field()
  public id: string;

  @Field()
  public balance: string;
}

@ObjectType()
export class Transaction {
  @Field()
  public ref: string;

  @Field()
  public time: Date;

  @Field()
  public target: string;

  @Field()
  public type: string;

  @Field()
  public note: string;
}
