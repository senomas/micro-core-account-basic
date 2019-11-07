import { Field, ObjectType, ArgsType, Int } from "type-graphql";
import { MaxLength, IsDecimal } from "class-validator";
import Decimal from "decimal.js";

@ObjectType()
export class Core {
}

@ArgsType()
export class AccountArgs {
  @Field()
  @MaxLength(32)
  public cif: string;
}

@ObjectType()
export class Account {
  @Field()
  public cif: string;

  @Field()
  public name: string;
}

@ArgsType()
export class SavingArgs {
  @Field()
  @MaxLength(32)
  public id: string;
}

@ObjectType()
export class Saving {
  @Field()
  public id: string;

  @Field()
  @IsDecimal()
  public balance: Decimal;
}

@ArgsType()
export class TransactionArgs {
  @Field({ nullable: true })
  public from?: Date;

  @Field()
  public to: Date;

  @Field(of => Int, { nullable: true })
  public skip?: number;

  @Field(of => Int, { nullable: true })
  public limit?: number;
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
  public balance: Decimal;

  @Field({ nullable: true })
  public note?: string;
}
