import { DataTypes, Model, InferAttributes, InferCreationAttributes } from "sequelize";
import sequelize from "./database";

interface CountryModel
  extends Model<
    InferAttributes<CountryModel>,
    InferCreationAttributes<CountryModel>
  > {
  id?: number;
  name: string;
  capital?: string;
  region?: string;
  population: number;
  flag_url?: string;
  independent?: boolean;
  exchange_rate?: number;
  estimated_gdp?: number;
  country_code: string;
  last_refreshed_at?: Date;
}

const Country = sequelize.define<CountryModel>(
  "Country",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    capital: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    population: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    country_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    exchange_rate: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    estimated_gdp: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    flag_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    independent: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    last_refreshed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    underscored: true,
    timestamps: false, // disable Sequelize’s auto timestamps (createdAt, updatedAt)
  }
);

export default Country;
